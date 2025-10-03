from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.orm import Session
from typing import List, Dict,  Any, Optional
from datetime import date
from pydantic import BaseModel

from api.db.models import (
    Channel,
    ContributionBaseline,
    ContributionPoint,
    ResponseCurvePoint,
)
from api.db.session import get_session

router = APIRouter(prefix="/runs", tags=["runs"])


class ContributionRow(BaseModel):
    time: date
    channel: str
    contribution: float
    baseline: float

class ResponseCurveRow(BaseModel):
    spend_multiplier: float
    channel: str
    mean: float
    lo: float
    hi: float


# ---------- API endpoints ----------
@router.get("/{run_id}/contributions", response_model=List[ContributionRow])
def get_contributions(run_id: int, session: Session = Depends(get_session)):
    stmt = (
        select(
            ContributionBaseline.time.label("time"),
            Channel.name.label("channel"),
            ContributionPoint.value.label("contribution"),
            ContributionBaseline.baseline.label("baseline"),
        )
        .join(Channel, Channel.id == ContributionPoint.channel_id)
        .join(
            ContributionBaseline,
            (ContributionBaseline.run_id == ContributionPoint.run_id)
            & (ContributionBaseline.time == ContributionPoint.time),
        )
        .where(ContributionPoint.run_id == run_id)
        .order_by(ContributionBaseline.time, Channel.name)
    )
    rows = session.execute(stmt).mappings().all()
    return rows


@router.get("/{run_id}/response-curves", response_model=List[ResponseCurveRow])
def get_response_curves(run_id: int, session: Session = Depends(get_session)):
    stmt = (
        select(
            ResponseCurvePoint.spend_multiplier,
            Channel.name.label("channel"),
            ResponseCurvePoint.mean,
            ResponseCurvePoint.lo,
            ResponseCurvePoint.hi,
        )
        .join(Channel, Channel.id == ResponseCurvePoint.channel_id)
        .where(ResponseCurvePoint.run_id == run_id)
        .order_by(ResponseCurvePoint.spend_multiplier, Channel.name)
    )
    rows = session.execute(stmt).mappings().all()
    return rows

def _clean(x: Optional[float]) -> Optional[float]:
    try:
        if x is None:
            return None
        if x != x:
            return None
        if x in (float("inf"), float("-inf")):
            return None
        return float(x)
    except Exception:
        return None

@router.get("/{run_id}/response-curve")
def get_response_curves_wide(
    run_id: int,
    session: Session = Depends(get_session),
    selected_channels: Optional[str] = Query(
        None, description="Comma-separated list, e.g. Channel0,Channel3"
    ),
    include_per_channel: bool = Query(
        True, description="Include per_channel arrays in the payload"
    ),
):
    stmt = (
        select(
            ResponseCurvePoint.spend_multiplier.label("spend_multiplier"),
            Channel.name.label("channel"),
            ResponseCurvePoint.mean.label("mean"),
            ResponseCurvePoint.lo.label("lo"),
            ResponseCurvePoint.hi.label("hi"),
        )
        .join(Channel, Channel.id == ResponseCurvePoint.channel_id)
        .where(ResponseCurvePoint.run_id == run_id)
        .order_by(ResponseCurvePoint.spend_multiplier, Channel.name)
    )

    names_filter = None
    if selected_channels:
        names_filter = [s.strip() for s in selected_channels.split(",") if s.strip()]
        if names_filter:
            stmt = stmt.where(Channel.name.in_(names_filter))

    rows = session.execute(stmt).mappings().all()
    combined_by_smul: Dict[float, Dict[str, Any]] = {}
    per_channel: Dict[str, List[Dict[str, Any]]] = {}

    for r in rows:
        smul = float(r["spend_multiplier"])
        ch   = str(r["channel"])

        if smul not in combined_by_smul:
            combined_by_smul[smul] = {"spend_multiplier": smul}

        combined = combined_by_smul[smul]
        combined[f"{ch}__mean"] = _clean(r["mean"])
        combined[f"{ch}__lo"]   = _clean(r["lo"])
        combined[f"{ch}__hi"]   = _clean(r["hi"])

        if include_per_channel:
            per_channel.setdefault(ch, []).append({
                "spend_multiplier": smul,
                "mean": _clean(r["mean"]),
                "ci_lo": _clean(r["lo"]),
                "ci_hi": _clean(r["hi"]),
                # "spend": None,
            })

    combined = [combined_by_smul[k] for k in sorted(combined_by_smul.keys())]

    payload: Dict[str, Any] = {"combined": combined}
    if include_per_channel:
        # sort each channel’s array by spend_multiplier to be nice to the UI
        for ch in per_channel:
            per_channel[ch].sort(key=lambda x: x["spend_multiplier"])
        payload["per_channel"] = per_channel

    return payload

@router.get("/{run_id}/contributions-wide")
def get_contributions_wide(
    run_id: int,
    session: Session = Depends(get_session),
    include_channels: Optional[str] = Query(
        None,
        description="Comma-separated list of channels to include (e.g. Channel0,Channel3)",
    ),
    round_to: int = Query(6, ge=0, le=12, description="Decimal places for percent values"),
):
    name_filter: Optional[List[str]] = None
    if include_channels:
        name_filter = [c.strip() for c in include_channels.split(",") if c.strip()]

    stmt = (
        select(
            ContributionBaseline.time.label("time"),
            Channel.name.label("channel"),
            ContributionPoint.value.label("contribution"),
            ContributionBaseline.baseline.label("baseline"),
        )
        .join(Channel, Channel.id == ContributionPoint.channel_id)
        .join(
            ContributionBaseline,
            (ContributionBaseline.run_id == ContributionPoint.run_id)
            & (ContributionBaseline.time == ContributionPoint.time),
        )
        .where(ContributionPoint.run_id == run_id)
        .order_by(ContributionBaseline.time, Channel.name)
    )
    if name_filter:
        stmt = stmt.where(Channel.name.in_(name_filter))

    rows = session.execute(stmt).mappings().all()

    time_buckets: Dict[date, Dict[str, Any]] = {}
    for r in rows:
        t = r["time"]
        if t not in time_buckets:
            time_buckets[t] = {"time": t.isoformat(), "baseline": float(r["baseline"])}
        time_buckets[t][r["channel"]] = float(r["contribution"])

    absolute: List[Dict[str, Any]] = []
    for t in sorted(time_buckets.keys()):
        absolute.append(time_buckets[t])

    percent: List[Dict[str, Any]] = []
    for row in absolute:
        baseline_val = float(row.get("baseline", 0.0))
        channel_sum = sum(
            float(v) for k, v in row.items()
            if k not in ("time", "baseline")
        )
        total = baseline_val + channel_sum
        if total == 0:
            percent_row = {k: (v if k == "time" else 0.0) for k, v in row.items()}
            percent.append(percent_row)
            continue

        percent_row: Dict[str, Any] = {"time": row["time"]}
        for k, v in row.items():
            if k == "time":
                continue
            pct = float(v) / total
            percent_row[k] = round(pct, round_to) if round_to is not None else pct
        percent.append(percent_row)

    return {"absolute": absolute, "percent": percent}
