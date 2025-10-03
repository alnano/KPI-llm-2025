"use client";
import ContributionChart from "@/components/contribution-chart";
import { ChannelPerformanceChart } from "@/components/response-chart";
import { Button } from "@workspace/ui/components/button";
import { useEffect, useState } from "react";

const channelData = [
  {
    spend_multiplier: 0.0,
    Channel0__mean: 0.0,
    Channel0__lo: 0.0,
    Channel0__hi: 0.0,
    Channel1__mean: 0.0,
    Channel1__lo: 0.0,
    Channel1__hi: 0.0,
    Channel2__mean: 0.0,
    Channel2__lo: 0.0,
    Channel2__hi: 0.0,
    Channel3__mean: 0.0,
    Channel3__lo: 0.0,
    Channel3__hi: 0.0,
    Channel4__mean: 0.0,
    Channel4__lo: 0.0,
    Channel4__hi: 0.0,
  },
  {
    spend_multiplier: 0.01,
    Channel0__mean: 1412950.375,
    Channel0__lo: 312374.3125,
    Channel0__hi: 3468584.0,
    Channel1__mean: 654915.0625,
    Channel1__lo: 155538.796875,
    Channel1__hi: 1657191.625,
    Channel2__mean: 364516.34375,
    Channel2__lo: 128815.703125,
    Channel2__hi: 762464.5,
    Channel3__mean: 1709627.75,
    Channel3__lo: 472340.3125,
    Channel3__hi: 4051924.25,
    Channel4__mean: 1937161.625,
    Channel4__lo: 403495.0,
    Channel4__hi: 5490415.0,
  },
  {
    spend_multiplier: 0.5,
    Channel0__mean: 70647518.0,
    Channel0__lo: 15618715.0,
    Channel0__hi: 173429200.0,
    Channel1__mean: 32745753.0,
    Channel1__lo: 7776939.5,
    Channel1__hi: 82859581.0,
    Channel2__mean: 18225817.0,
    Channel2__lo: 6440785.5,
    Channel2__hi: 38123225.0,
    Channel3__mean: 85481388.0,
    Channel3__lo: 23617015.0,
    Channel3__hi: 202596213.0,
    Channel4__mean: 96858081.0,
    Channel4__lo: 20174750.0,
    Channel4__hi: 274520750.0,
  },
  {
    spend_multiplier: 1.0,
    Channel0__mean: 141295036.0,
    Channel0__lo: 31237430.0,
    Channel0__hi: 346858400.0,
    Channel1__mean: 65491506.0,
    Channel1__lo: 15553879.0,
    Channel1__hi: 165719162.0,
    Channel2__mean: 36451634.0,
    Channel2__lo: 12881571.0,
    Channel2__hi: 76246450.0,
    Channel3__mean: 170962776.0,
    Channel3__lo: 47234030.0,
    Channel3__hi: 405192426.0,
    Channel4__mean: 193716162.0,
    Channel4__lo: 40349500.0,
    Channel4__hi: 549041500.0,
  },
  {
    spend_multiplier: 1.5,
    Channel0__mean: 211942554.0,
    Channel0__lo: 46856145.0,
    Channel0__hi: 520287600.0,
    Channel1__mean: 98237259.0,
    Channel1__lo: 23330818.5,
    Channel1__hi: 248578743.0,
    Channel2__mean: 54677451.0,
    Channel2__lo: 19322356.5,
    Channel2__hi: 114369675.0,
    Channel3__mean: 256444164.0,
    Channel3__lo: 70851045.0,
    Channel3__hi: 607788639.0,
    Channel4__mean: 290574243.0,
    Channel4__lo: 60524250.0,
    Channel4__hi: 823562250.0,
  },
  {
    spend_multiplier: 2.0,
    Channel0__mean: 282590072.0,
    Channel0__lo: 62474860.0,
    Channel0__hi: 693716800.0,
    Channel1__mean: 130983012.0,
    Channel1__lo: 31107758.0,
    Channel1__hi: 331438324.0,
    Channel2__mean: 72903268.0,
    Channel2__lo: 25763142.0,
    Channel2__hi: 152492900.0,
    Channel3__mean: 341925552.0,
    Channel3__lo: 94468060.0,
    Channel3__hi: 810384852.0,
    Channel4__mean: 387432324.0,
    Channel4__lo: 80699000.0,
    Channel4__hi: 1098083000.0,
  },
  {
    spend_multiplier: 2.5,
    Channel0__mean: 353237590.0,
    Channel0__lo: 78093575.0,
    Channel0__hi: 867146000.0,
    Channel1__mean: 163728765.0,
    Channel1__lo: 38884697.5,
    Channel1__hi: 414297905.0,
    Channel2__mean: 91129085.0,
    Channel2__lo: 32203927.5,
    Channel2__hi: 190616125.0,
    Channel3__mean: 427406940.0,
    Channel3__lo: 118085075.0,
    Channel3__hi: 1012981065.0,
    Channel4__mean: 484290405.0,
    Channel4__lo: 100873750.0,
    Channel4__hi: 1372603750.0,
  },
  {
    spend_multiplier: 3.0,
    Channel0__mean: 423885108.0,
    Channel0__lo: 93712290.0,
    Channel0__hi: 1040575200.0,
    Channel1__mean: 196474518.0,
    Channel1__lo: 46661637.0,
    Channel1__hi: 497157486.0,
    Channel2__mean: 109354902.0,
    Channel2__lo: 38644713.0,
    Channel2__hi: 228739350.0,
    Channel3__mean: 512888328.0,
    Channel3__lo: 141702090.0,
    Channel3__hi: 1215577278.0,
    Channel4__mean: 581148486.0,
    Channel4__lo: 121048500.0,
    Channel4__hi: 1647124500.0,
  },
  {
    spend_multiplier: 3.5,
    Channel0__mean: 494532626.0,
    Channel0__lo: 109331005.0,
    Channel0__hi: 1214004400.0,
    Channel1__mean: 229220271.0,
    Channel1__lo: 54438576.5,
    Channel1__hi: 580017067.0,
    Channel2__mean: 127580719.0,
    Channel2__lo: 45085498.5,
    Channel2__hi: 266862575.0,
    Channel3__mean: 598369716.0,
    Channel3__lo: 165319105.0,
    Channel3__hi: 1418173491.0,
    Channel4__mean: 678006567.0,
    Channel4__lo: 141223250.0,
    Channel4__hi: 1921645250.0,
  },
  {
    spend_multiplier: 4.0,
    Channel0__mean: 565180144.0,
    Channel0__lo: 124949720.0,
    Channel0__hi: 1387433600.0,
    Channel1__mean: 261966024.0,
    Channel1__lo: 62215516.0,
    Channel1__hi: 662876648.0,
    Channel2__mean: 145806536.0,
    Channel2__lo: 51526284.0,
    Channel2__hi: 304985800.0,
    Channel3__mean: 683851104.0,
    Channel3__lo: 188936120.0,
    Channel3__hi: 1620769704.0,
    Channel4__mean: 774864648.0,
    Channel4__lo: 161398000.0,
    Channel4__hi: 2196166000.0,
  },
  {
    spend_multiplier: 4.5,
    Channel0__mean: 635827662.0,
    Channel0__lo: 140568435.0,
    Channel0__hi: 1560862800.0,
    Channel1__mean: 294711777.0,
    Channel1__lo: 69992455.5,
    Channel1__hi: 745736229.0,
    Channel2__mean: 164032353.0,
    Channel2__lo: 57967069.5,
    Channel2__hi: 343109025.0,
    Channel3__mean: 769332492.0,
    Channel3__lo: 212553135.0,
    Channel3__hi: 1823365917.0,
    Channel4__mean: 871722729.0,
    Channel4__lo: 181572750.0,
    Channel4__hi: 2470686750.0,
  },
  {
    spend_multiplier: 5.0,
    Channel0__mean: 706475180.0,
    Channel0__lo: 156187150.0,
    Channel0__hi: 1734292000.0,
    Channel1__mean: 327457530.0,
    Channel1__lo: 77769395.0,
    Channel1__hi: 828595810.0,
    Channel2__mean: 182258170.0,
    Channel2__lo: 64407855.0,
    Channel2__hi: 381232250.0,
    Channel3__mean: 854813880.0,
    Channel3__lo: 236170150.0,
    Channel3__hi: 2025962130.0,
    Channel4__mean: 968580810.0,
    Channel4__lo: 201747500.0,
    Channel4__hi: 2745207500.0,
  },
];

export default function DashboardPage() {
  const [ok, setOk] = useState<boolean | null>(null);
  const [payload, setPayload] = useState<{
    absolute: any[];
    percent: any[];
  } | null>(null);
  const [resPayload, setResPayload] = useState();
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
      setOk(false);
      try {
        const authRes = await fetch(`http://localhost:8000/auth/me`, {
          credentials: "include",
        });
        if (!authRes.ok) {
          throw new Error("Not authenticated");
        }

        const [contribRes, curveRes] = await Promise.all([
          fetch("http://localhost:8000/runs/1/contributions-wide"),
          fetch("http://localhost:8000/runs/1/response-curve"),
        ]);

        if (!contribRes.ok || !curveRes.ok) {
          throw new Error("One of the requests failed");
        }

        const [contribJson, curveJson] = await Promise.all([
          contribRes.json(),
          curveRes.json(),
        ]);

        if (!cancelled) {
          setPayload(contribJson);
          setResPayload(curveJson);
          setOk(true);
        }
      } catch (e) {
        if (!cancelled) {
          setErr(String(e));
        }
      }
    };

    loadData();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleLogOut = async () => {
    const res = await fetch(`http://localhost:8000/auth/logout`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    });
    if (res.ok) {
      location.replace("/login");
    } else {
      console.error("Logout failed", res.status);
    }
  };

  if (err) return <div className="text-red-500">Error: {err}</div>;
  if (!payload) return <div>Loading…</div>;

  if (ok === null) return <p>Loading…</p>;
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 space-y-6 ">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">
            Analytics Dashboard
          </h1>
          <p className="text-muted-foreground text-lg">
            Track your activity and monitor channel performance metrics
          </p>
        </div>
        <Button onClick={handleLogOut}>Log Out</Button>
        <div className="grid gap-6">
          <ContributionChart contributionData={payload} />
          <ChannelPerformanceChart data={resPayload} />
        </div>
      </div>
    </div>
  );
}
