"use client";

import * as React from "react";
// import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@workspace/ui/components/card";
// import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@workspace/ui/components/toggle-group";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

type WideRow = { time: string; [k: string]: number | string };
type ApiPayload = { absolute: WideRow[]; percent: WideRow[] };

const fmtNumber = (v: number) =>
  Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(v);

const fmtPercent = (v: number) =>
  Intl.NumberFormat(undefined, {
    style: "percent",
    maximumFractionDigits: 1,
  }).format(v);

const COLORS = [
  "#6366F1",
  "#22C55E",
  "#F59E0B",
  "#06B6D4",
  "#EF4444",
  "#A78BFA",
  "#10B981",
  "#F97316",
  "#3B82F6",
  "#84CC16",
];

function getChannels(rows: WideRow[]) {
  if (!rows?.length) return [];
  return Object.keys(rows[0]).filter((k) => k !== "time");
}

export function ContributionChart({ data }: { data: ApiPayload }) {
  const [mode, setMode] = React.useState<"absolute" | "percent">("absolute");
  const rows = mode === "absolute" ? data.absolute : data.percent;
  const channels = getChannels(rows);

  // Optionally hide baseline by default:
  // const channels = getChannels(rows).filter(c => c !== "baseline")

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <CardTitle>Channel Contributions Over Time</CardTitle>

        <ToggleGroup
          type="single"
          value={mode}
          onValueChange={(v) => v && setMode(v as "absolute" | "percent")}
          className="ml-auto"
        >
          <ToggleGroupItem value="absolute" aria-label="Absolute">
            Absolute
          </ToggleGroupItem>
          <ToggleGroupItem value="percent" aria-label="Percent">
            Percent
          </ToggleGroupItem>
        </ToggleGroup>
      </CardHeader>

      <CardContent className="h-[420px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={rows}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" />
            <YAxis
              tickFormatter={(v) =>
                mode === "absolute"
                  ? fmtNumber(v as number)
                  : fmtPercent(v as number)
              }
            />
            <Tooltip
              formatter={(val: any, name: any) =>
                mode === "absolute"
                  ? [fmtNumber(val as number), name]
                  : [fmtPercent(val as number), name]
              }
            />
            <Legend />
            {channels.map((ch, i) => (
              <Area
                key={ch}
                type="monotone"
                dataKey={ch}
                stackId="1"
                stroke={COLORS[i % COLORS.length]}
                fill={COLORS[i % COLORS.length]}
                fillOpacity={0.0}
                dot={false}
                isAnimationActive={false}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
