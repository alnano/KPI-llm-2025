"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@workspace/ui/components/chart";
import { useState, useEffect } from "react";

interface ChannelData {
  spend_multiplier: number;
  Channel0__mean: number;
  Channel0__lo: number;
  Channel0__hi: number;
  Channel1__mean: number;
  Channel1__lo: number;
  Channel1__hi: number;
  Channel2__mean: number;
  Channel2__lo: number;
  Channel2__hi: number;
  Channel3__mean: number;
  Channel3__lo: number;
  Channel3__hi: number;
  Channel4__mean: number;
  Channel4__lo: number;
  Channel4__hi: number;
}

interface ChannelPerformanceChartProps {
  data: ChannelData[];
  className?: string;
}

const chartConfig = {
  Channel0: {
    label: "Channel 0",
    color: "var(--chart-1)",
  },
  Channel1: {
    label: "Channel 1",
    color: "var(--chart-2)",
  },
  Channel2: {
    label: "Channel 2",
    color: "var(--chart-3)",
  },
  Channel3: {
    label: "Channel 3",
    color: "var(--chart-4)",
  },
  Channel4: {
    label: "Channel 4",
    color: "var(--chart-5)",
  },
};
const ALL_CHANNELS = [
  "Channel0",
  "Channel1",
  "Channel2",
  "Channel3",
  "Channel4",
];

type ChannelPerformanceChartProps = {
  data: { combined: any[] } | null | undefined;
  className?: string;
};

export function ChannelPerformanceChart({
  data,
  className,
}: ChannelPerformanceChartProps) {
  const rows = data?.combined ?? [];

  const [selected, setSelected] = useState<string[]>(ALL_CHANNELS);

  useEffect(() => {
    if (!selected.length) setSelected(ALL_CHANNELS);
  }, [selected]);

  const isAll = selected.length === ALL_CHANNELS.length;

  const toggleAll = () => {
    setSelected(isAll ? [] : [...ALL_CHANNELS]);
  };

  const toggleOne = (ch: string) => {
    setSelected((prev) =>
      prev.includes(ch) ? prev.filter((c) => c !== ch) : [...prev, ch],
    );
  };

  const colorFor = (ch: string) =>
    getComputedStyle(document.documentElement).getPropertyValue(
      `--color-${ch}`,
    ) || "#8884d8";

  const exactlyOne = selected.length === 1 ? selected[0] : null;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Channel Performance Analysis</CardTitle>
        <CardDescription>
          Marketing channel performance by spend multiplier with confidence
          intervals
        </CardDescription>

        {/* Multi-select controls */}
        <div className="flex flex-wrap items-center gap-3 pt-4">
          <label className="inline-flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="h-4 w-4"
              checked={isAll}
              onChange={toggleAll}
            />
            <span>Select all</span>
          </label>

          <div className="flex flex-wrap gap-2">
            {ALL_CHANNELS.map((ch) => {
              const checked = selected.includes(ch);
              return (
                <label
                  key={ch}
                  className={`inline-flex items-center gap-2 px-2 py-1 rounded-md text-sm cursor-pointer transition-colors ${
                    checked
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleOne(ch)}
                    className="h-4 w-4 accent-current"
                  />
                  <span>
                    {chartConfig[ch as keyof typeof chartConfig].label}
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <ChartContainer
          config={chartConfig}
          className="h-[400px] w-full overflow-visible"
        >
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={rows}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              style={{ pointerEvents: "auto" }}
            >
              <defs>
                {ALL_CHANNELS.map((ch) => (
                  <linearGradient
                    key={`fill-${ch}`}
                    id={`fill${ch}`}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor={`var(--color-${ch})`}
                      stopOpacity={0.8}
                    />
                    <stop
                      offset="95%"
                      stopColor={`var(--color-${ch})`}
                      stopOpacity={0.1}
                    />
                  </linearGradient>
                ))}
                {ALL_CHANNELS.map((ch) => (
                  <linearGradient
                    key={`range-${ch}`}
                    id={`fillRange${ch}`}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor={`var(--color-${ch})`}
                      stopOpacity={0.3}
                    />
                    <stop
                      offset="95%"
                      stopColor={`var(--color-${ch})`}
                      stopOpacity={0.05}
                    />
                  </linearGradient>
                ))}
              </defs>

              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="spend_multiplier"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(v) => `${v}x`}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(v) => `${(v / 1_000_000).toFixed(1)}M`}
              />
              {exactlyOne && (
                <>
                  <Area
                    type="monotone"
                    dataKey={`${exactlyOne}__hi`}
                    stroke="none"
                    fill={`url(#fillRange${exactlyOne})`}
                    fillOpacity={1}
                    isAnimationActive={false}
                  />
                  <Area
                    type="monotone"
                    dataKey={`${exactlyOne}__lo`}
                    stroke="none"
                    fill="var(--color-background)"
                    fillOpacity={1}
                    isAnimationActive={false}
                  />
                </>
              )}

              {selected.map((ch) => (
                <Area
                  key={`mean-${ch}`}
                  type="monotone"
                  dataKey={`${ch}__mean`}
                  stroke={`var(--color-${ch})`}
                  strokeWidth={2}
                  fill={exactlyOne === ch ? `url(#fill${ch})` : "none"} // fill only when it's the single selection
                  fillOpacity={1}
                  isAnimationActive={false}
                />
              ))}

              <Tooltip
                wrapperStyle={{ zIndex: 50 }}
                cursor={{ strokeDasharray: "3 3" }}
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  const row = payload[0]?.payload ?? {};
                  const fmt = (n: number) => `$${Number(n).toLocaleString()}`;

                  if (exactlyOne) {
                    const mean = row?.[`${exactlyOne}__mean`];
                    const lo = row?.[`${exactlyOne}__lo`];
                    const hi = row?.[`${exactlyOne}__hi`];
                    if (mean == null && lo == null && hi == null) return null;
                    return (
                      <div className="rounded-md bg-white/95 backdrop-blur p-2 shadow-md border text-sm">
                        <div className="font-medium mb-1">
                          Spend Multiplier: {label}x
                        </div>
                        {mean != null && (
                          <div>
                            Mean: <b>{fmt(mean)}</b>
                          </div>
                        )}
                        {lo != null && <div>Low: {fmt(lo)}</div>}
                        {hi != null && <div>High: {fmt(hi)}</div>}
                      </div>
                    );
                  }

                  const items = selected
                    .map((ch) => ({ ch, v: row?.[`${ch}__mean`] }))
                    .filter((i) => i.v != null);

                  if (!items.length) return null;
                  return (
                    <div className="rounded-md bg-white/95 backdrop-blur p-2 shadow-md border text-sm">
                      <div className="font-medium mb-1">
                        Spend Multiplier: {label}x
                      </div>
                      {items.map(({ ch, v }) => (
                        <div key={ch} className="flex items-center gap-2">
                          <span
                            className="inline-block h-2 w-2 rounded-full"
                            style={{ background: colorFor(ch) }}
                          />
                          <span>
                            {chartConfig[ch as keyof typeof chartConfig].label}:
                          </span>
                          <b>{fmt(v as number)}</b>
                        </div>
                      ))}
                    </div>
                  );
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartContainer>

        <div className="mt-4 text-sm text-muted-foreground">
          <p>
            {exactlyOne
              ? "Shaded band = that channel’s confidence interval; solid line = mean."
              : "Multiple channels selected. Showing mean lines for each channel; switch to a single selection to see its confidence interval."}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
