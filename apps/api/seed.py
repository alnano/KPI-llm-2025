import os
from datetime import date
from typing import Dict, List, Any

from sqlalchemy import create_engine, select
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.dialects.postgresql import insert
from meridian.analysis.visualizer import MediaSummary, MediaEffects
from meridian.model.model import load_mmm
from functools import lru_cache
import numpy as np
import pandas as pd
from pathlib import Path
from db.models import (
    Base,
    ModelRun,
    Channel,
    ContributionBaseline,
    ContributionPoint,
    ResponseCurvePoint,
)

# -------- Config --------
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+psycopg://postgres:password@localhost:5432/local")

engine = create_engine(DATABASE_URL, future=True, echo=False)
SessionLocal = sessionmaker(bind=engine, expire_on_commit=False, future=True)


CONTRIBUTION_ABSOLUTE: List[Dict[str, Any]] = [
    {
        "time": "2021-01-25",
        "Channel0": 166929.171875,
        "Channel1": 43205.984375,
        "Channel2": 36925.71875,
        "Channel3": 283162.90625,
        "Channel4": 211988.359375,
        "baseline": 6527876.5,
    },
    {
        "time": "2021-02-01",
        "Channel0": 257872.15625,
        "Channel1": 128256.140625,
        "Channel2": 62895.03515625,
        "Channel3": 395524.875,
        "Channel4": 263670.71875,
        "baseline": 6003216.5,
    },
    {
        "time": "2021-02-08",
        "Channel0": 289309.125,
        "Channel1": 144354.5,
        "Channel2": 65324.83203125,
        "Channel3": 425058.90625,
        "Channel4": 282751.4375,
        "baseline": 7789101.5,
    },
    {
        "time": "2021-02-15",
        "Channel0": 322904.875,
        "Channel1": 136499.296875,
        "Channel2": 58784.91015625,
        "Channel3": 439768.28125,
        "Channel4": 341516.375,
        "baseline": 7163877.5,
    },
]

RESPONSE_CURVE: List[Dict[str, Any]] = [
    {
        "spend_multiplier": 0.0,
        "Channel0__mean": 0.0, "Channel0__lo": 0.0, "Channel0__hi": 0.0,
        "Channel1__mean": 0.0, "Channel1__lo": 0.0, "Channel1__hi": 0.0,
        "Channel2__mean": 0.0, "Channel2__lo": 0.0, "Channel2__hi": 0.0,
        "Channel3__mean": 0.0, "Channel3__lo": 0.0, "Channel3__hi": 0.0,
        "Channel4__mean": 0.0, "Channel4__lo": 0.0, "Channel4__hi": 0.0,
    },
    {
        "spend_multiplier": 0.01,
        "Channel0__mean": 1412950.375, "Channel0__lo": 312374.3125,   "Channel0__hi": 3468584.0,
        "Channel1__mean":  654915.0625, "Channel1__lo": 155538.796875, "Channel1__hi": 1657191.625,
        "Channel2__mean":  364516.34375,"Channel2__lo": 128815.703125, "Channel2__hi": 762464.5,
        "Channel3__mean": 1709627.75,   "Channel3__lo": 472340.3125,   "Channel3__hi": 4051924.25,
        "Channel4__mean": 1937161.625,  "Channel4__lo": 403495.0,      "Channel4__hi": 5490415.0,
    },
]


# -------- Helpers --------
def parse_contribution_channels(rows: List[Dict[str, Any]]) -> List[str]:
    names = set()
    for row in rows:
        for k in row.keys():
            if k not in ("time", "baseline"):
                names.add(k)
    return sorted(names)


def parse_response_curve_channels(rows: List[Dict[str, Any]]) -> List[str]:
    names = set()
    for row in rows:
        for k in row.keys():
            if "__mean" in k:
                names.add(k.split("__mean")[0])
    return sorted(names)


def get_or_create_run(session: Session) -> int:
    stmt = (
        insert(ModelRun)
        .values(model_name="meridian_v1", run_label="sample_run", params_json={})
        .on_conflict_do_update(
            index_elements=["model_name", "run_label"],
            set_={"params_json": ModelRun.params_json}  # no-op update
        )
        .returning(ModelRun.id)
    )
    run_id = session.execute(stmt).scalar_one()
    return int(run_id)


def upsert_channels(session: Session, names: List[str]) -> Dict[str, int]:
    if not names:
        return {}
    session.execute(
        insert(Channel)
        .values([{"name": n} for n in names])
        .on_conflict_do_nothing()
    )
    rows = session.execute(select(Channel).where(Channel.name.in_(names))).scalars().all()
    return {row.name: int(row.id) for row in rows}

@lru_cache(maxsize=1)
def get_model():
    base = Path(__file__).resolve().parent
    pkl_path = base / "data" / "saved_mmm.pkl"
    return load_mmm(str(pkl_path))

def _clean(x):
    try:
        if x is None:
            return None
        xf = float(x)
        if np.isnan(xf) or np.isinf(xf):
            return None
        return xf
    except Exception:
        return None

def build_response_curves_payload():
    """
    Standalone function version of your response_curves endpoint.
    Returns: {"combined": [...], "per_channel": {...}}
    """
    m = get_model()
    me = MediaEffects(m)
    ds = me.response_curves_data()

    channels = [str(c) for c in ds.channel.values]
    if not channels:
        return {"combined": [], "per_channel": {}}

    smul_grid = ds["spend_multiplier"].values.tolist()  # shared grid

    combined = []
    for i, s_mul in enumerate(smul_grid):
        row = {"spend_multiplier": float(s_mul)}
        for ch in channels:
            incr = ds["incremental_outcome"].sel(channel=ch)
            mu = incr.sel(metric="mean").values[i]
            lo = incr.sel(metric="ci_lo").values[i]
            hi = incr.sel(metric="ci_hi").values[i]
            row[f"{ch}__mean"] = _clean(mu)
            row[f"{ch}__lo"]   = _clean(lo)
            row[f"{ch}__hi"]   = _clean(hi)
        combined.append(row)

    return combined

def build_contributions_timeseries(selected_channels=None, include_non_paid=False):
    """
    Standalone function that builds contributions timeseries.
    Returns: {"absolute": [...], "percent": [...]}
    """

    m = get_model()
    ms = MediaSummary(m)

    sel = None
    if selected_channels:
        if isinstance(selected_channels, str):
            sel = [s.strip() for s in selected_channels.split(",") if s.strip()]
        elif isinstance(selected_channels, (list, tuple)):
            sel = [s.strip() for s in selected_channels if s.strip()]

    df = ms.contribution_metrics(
        selected_channels=sel,
        include_non_paid=include_non_paid,
        aggregate_times=False,          # <-- keep time dimension
    ).copy()

    df["time"] = pd.to_datetime(df["time"]).dt.strftime("%Y-%m-%d")

    df = df.replace([np.inf, -np.inf], np.nan)

    wide_abs = df.pivot_table(
        index="time",
        columns="channel",
        values="incremental_outcome",
        aggfunc="sum",
    ).fillna(0.0)

    wide_pct = df.pivot_table(
        index="time",
        columns="channel",
        values="pct_of_contribution",
        aggfunc="sum",
    ).fillna(0.0)

    records_abs = wide_abs.reset_index().to_dict(orient="records")
    records_pct = wide_pct.reset_index().to_dict(orient="records")

    return {"absolute": records_abs, "percent": records_pct}

def seed_contributions(session: Session, run_id: int, channel_map: Dict[str, int]) -> None:
    base_values = []
    contrib_values = []
    cont_abs = build_contributions_timeseries()
    const_abs_abs = cont_abs["absolute"]
    # for row in CONTRIBUTION_ABSOLUTE:
    for row in const_abs_abs:
        t = date.fromisoformat(row["time"])
        base_values.append({"run_id": run_id, "time": t, "baseline": float(row["baseline"])})

        for name, val in row.items():
            if name in ("time", "baseline"):
                continue
            ch_id = channel_map.get(name)
            if ch_id is None:
                continue
            contrib_values.append(
                {"run_id": run_id, "time": t, "channel_id": ch_id, "value": float(val)}
            )

    if base_values:
        session.execute(
            insert(ContributionBaseline).values(base_values).on_conflict_do_nothing()
        )
    if contrib_values:
        session.execute(
            insert(ContributionPoint).values(contrib_values).on_conflict_do_nothing()
        )


def seed_response_curve(session: Session, run_id: int, channel_map: Dict[str, int]) -> None:
    rc_values = []
    response_curve_payload = build_response_curves_payload()

    for row in response_curve_payload:
        sm = row["spend_multiplier"]
        for name, ch_id in channel_map.items():
            mean = float(row.get(f"{name}__mean", 0.0))
            lo   = float(row.get(f"{name}__lo",   0.0))
            hi   = float(row.get(f"{name}__hi",   0.0))
            if any(k in row for k in (f"{name}__mean", f"{name}__lo", f"{name}__hi")):
                rc_values.append(
                    {
                        "run_id": run_id,
                        "spend_multiplier": sm,
                        "channel_id": ch_id,
                        "mean": mean,
                        "lo": lo,
                        "hi": hi,
                    }
                )

    if rc_values:
        session.execute(
            insert(ResponseCurvePoint).values(rc_values).on_conflict_do_nothing()
        )


def main() -> None:
    with SessionLocal() as session:
        channels = sorted(set(parse_contribution_channels(CONTRIBUTION_ABSOLUTE))
                          | set(parse_response_curve_channels(RESPONSE_CURVE)))
        channel_map = upsert_channels(session, channels)
        run_id = get_or_create_run(session)

        seed_contributions(session, run_id, channel_map)
        seed_response_curve(session, run_id, channel_map)

        session.commit()
    print("+++ Seed complete. +++ :)")


if __name__ == "__main__":
    main()
