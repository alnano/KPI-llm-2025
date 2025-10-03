"use client";

import { useState, useMemo } from "react";
import {
  Area,
  AreaChart,
  Brush,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card } from "@workspace/ui/components/card";
import { Button } from "@workspace/ui/components/button";
import { Checkbox } from "@workspace/ui/components/checkbox";
import { Label } from "@workspace/ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";

const mockData = {
  absolute: [
    {
      time: "2021-01-25",
      Channel0: 166929.171875,
      Channel1: 43205.984375,
      Channel2: 36925.71875,
      Channel3: 283162.90625,
      Channel4: 211988.359375,
      baseline: 6527876.5,
    },
    {
      time: "2021-02-01",
      Channel0: 257872.15625,
      Channel1: 128256.140625,
      Channel2: 62895.03515625,
      Channel3: 395524.875,
      Channel4: 263670.71875,
      baseline: 6003216.5,
    },
    {
      time: "2021-02-08",
      Channel0: 198234.5,
      Channel1: 95432.25,
      Channel2: 48765.125,
      Channel3: 312456.75,
      Channel4: 234567.875,
      baseline: 6234567.25,
    },
    {
      time: "2021-02-15",
      Channel0: 223456.75,
      Channel1: 112345.5,
      Channel2: 56789.25,
      Channel3: 345678.125,
      Channel4: 267890.375,
      baseline: 6456789.5,
    },
    {
      time: "2021-02-22",
      Channel0: 189012.25,
      Channel1: 87654.125,
      Channel2: 43210.875,
      Channel3: 298765.5,
      Channel4: 221098.625,
      baseline: 6123456.75,
    },
    {
      time: "2021-03-01",
      Channel0: 245678.875,
      Channel1: 134567.25,
      Channel2: 67890.5,
      Channel3: 378901.125,
      Channel4: 289012.75,
      baseline: 6567890.25,
    },
    {
      time: "2021-03-08",
      Channel0: 212345.5,
      Channel1: 98765.375,
      Channel2: 54321.125,
      Channel3: 323456.875,
      Channel4: 245678.25,
      baseline: 6345678.5,
    },
    {
      time: "2021-03-15",
      Channel0: 278901.125,
      Channel1: 145678.75,
      Channel2: 72345.625,
      Channel3: 412345.5,
      Channel4: 301234.875,
      baseline: 6789012.75,
    },
  ],
};

const CHANNEL_COLORS = {
  Channel0: "var(--chart-1)",
  Channel1: "var(--chart-2)",
  Channel2: "var(--chart-3)",
  Channel3: "var(--chart-4)",
  Channel4: "var(--chart-5)",
  baseline: "var(--muted-foreground)",
};

type ViewMode = "absolute" | "percentage";

export default function ContributionChart({ contributionData }) {
  const [viewMode, setViewMode] = useState<ViewMode>("absolute");
  const [includeBaseline, setIncludeBaseline] = useState(false);
  const [selectedChannels, setSelectedChannels] = useState<string[]>([
    "Channel0",
    "Channel1",
    "Channel2",
    "Channel3",
    "Channel4",
  ]);

  const allChannels = [
    "Channel0",
    "Channel1",
    "Channel2",
    "Channel3",
    "Channel4",
  ];

  // Aggregate data by week (already weekly in mock data)
  const aggregatedData = useMemo(() => {
    return contributionData.absolute.map((entry) => {
      const date = new Date(entry.time);
      return {
        ...entry,
        weekStart: date.toISOString().split("T")[0],
      };
    });
  }, []);

  const chartData = useMemo(() => {
    return aggregatedData.map((entry) => {
      if (viewMode === "percentage") {
        const total = allChannels.reduce((sum, channel) => {
          return sum + (entry[channel as keyof typeof entry] as number);
        }, 0);
        const baselineValue = includeBaseline ? entry.baseline : 0;
        const grandTotal = total + baselineValue;

        const percentageEntry: any = {
          time: entry.time,
          weekStart: entry.weekStart,
        };

        allChannels.forEach((channel) => {
          percentageEntry[channel] =
            ((entry[channel as keyof typeof entry] as number) / grandTotal) *
            100;
        });

        if (includeBaseline) {
          percentageEntry.baseline = (entry.baseline / grandTotal) * 100;
        }

        return percentageEntry;
      } else {
        const absoluteEntry: any = {
          time: entry.time,
          weekStart: entry.weekStart,
        };

        allChannels.forEach((channel) => {
          absoluteEntry[channel] = entry[channel as keyof typeof entry];
        });

        if (includeBaseline) {
          absoluteEntry.baseline = entry.baseline;
        }

        return absoluteEntry;
      }
    });
  }, [aggregatedData, viewMode, includeBaseline]);

  const summaryStats = useMemo(() => {
    const channelTotals: Record<string, number> = {};

    chartData.forEach((entry) => {
      selectedChannels.forEach((channel) => {
        if (!channelTotals[channel]) {
          channelTotals[channel] = 0;
        }
        channelTotals[channel] += entry[channel] || 0;
      });
    });

    const total = Object.values(channelTotals).reduce(
      (sum, val) => sum + val,
      0,
    );

    const topChannels = Object.entries(channelTotals)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3);

    return { total, topChannels, channelTotals };
  }, [chartData, selectedChannels]);

  const toggleChannel = (channel: string) => {
    setSelectedChannels((prev) =>
      prev.includes(channel)
        ? prev.filter((c) => c !== channel)
        : [...prev, channel],
    );
  };

  const selectAll = () => {
    setSelectedChannels([...allChannels]);
  };

  const selectNone = () => {
    setSelectedChannels([]);
  };

  const formatValue = (value: number) => {
    if (viewMode === "percentage") {
      return `${value.toFixed(2)}%`;
    }
    return new Intl.NumberFormat("en-US", {
      notation: "compact",
      compactDisplay: "short",
    }).format(value);
  };

  const formatAxisValue = (value: number) => {
    if (viewMode === "percentage") {
      return `${value.toFixed(0)}%`;
    }
    return new Intl.NumberFormat("en-US", {
      notation: "compact",
      compactDisplay: "short",
    }).format(value);
  };

  return (
    <div className="space-y-6">
      {/* Summary Bar */}
      <Card className="border-border bg-card p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            {/* <TrendingUp className="h-5 w-5 text-chart-1" /> */}
            <div>
              <p className="text-sm text-muted-foreground">
                Total Contribution
              </p>
              <p className="text-2xl font-bold text-foreground">
                {formatValue(summaryStats.total)}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-6">
            {summaryStats.topChannels.map(([channel, value], index) => (
              <div key={channel}>
                <p className="text-sm text-muted-foreground">
                  #{index + 1} {channel}
                </p>
                <p className="text-lg font-semibold text-foreground">
                  {formatValue(value)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Controls */}
      <Card className="border-border bg-card p-6">
        <div className="flex flex-wrap items-end gap-6">
          {/* View Mode Toggle */}
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">View Mode</Label>
            <Select
              value={viewMode}
              onValueChange={(value) => setViewMode(value as ViewMode)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="absolute">Absolute</SelectItem>
                <SelectItem value="percentage">% Share</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Baseline Toggle */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="baseline"
              checked={includeBaseline}
              onCheckedChange={(checked) =>
                setIncludeBaseline(checked as boolean)
              }
            />
            <Label
              htmlFor="baseline"
              className="cursor-pointer text-sm font-medium text-foreground"
            >
              Include Baseline
            </Label>
          </div>

          {/* Channel Selection */}
          <div className="flex-1 space-y-2">
            <Label className="text-sm text-muted-foreground">Channels</Label>
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={selectAll}>
                  Select All
                </Button>
                <Button variant="outline" size="sm" onClick={selectNone}>
                  Select None
                </Button>
              </div>
              <div className="flex flex-wrap gap-4">
                {allChannels.map((channel) => (
                  <div key={channel} className="flex items-center space-x-2">
                    <Checkbox
                      id={channel}
                      checked={selectedChannels.includes(channel)}
                      onCheckedChange={() => toggleChannel(channel)}
                    />
                    <Label
                      htmlFor={channel}
                      className="flex cursor-pointer items-center gap-2 text-sm font-medium text-foreground"
                    >
                      <div
                        className="h-3 w-3 rounded-sm"
                        style={{
                          backgroundColor:
                            CHANNEL_COLORS[
                              channel as keyof typeof CHANNEL_COLORS
                            ],
                        }}
                      />
                      {channel}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Chart */}
      <Card className="border-border bg-card p-6">
        <div className="mb-4 flex items-center gap-2">
          {/* <Calendar className="h-5 w-5 text-muted-foreground" /> */}
          <h3 className="text-lg font-semibold text-foreground">
            Channel Contributions Over Time
          </h3>
        </div>
        <ResponsiveContainer width="100%" height={500}>
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--border)"
              opacity={0.3}
            />
            <XAxis
              dataKey="time"
              stroke="var(--muted-foreground)"
              tick={{ fill: "var(--muted-foreground)" }}
              tickFormatter={(value) =>
                new Date(value).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })
              }
            />
            <YAxis
              stroke="var(--muted-foreground)"
              tick={{ fill: "var(--muted-foreground)" }}
              tickFormatter={formatAxisValue}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--popover)",
                border: "1px solid var(--border)",
                borderRadius: "8px",
                color: "var(--popover-foreground)",
              }}
              formatter={(value: number) => formatValue(value)}
              labelFormatter={(label) =>
                new Date(label).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })
              }
            />
            <Legend
              wrapperStyle={{ paddingTop: "20px" }}
              iconType="square"
              formatter={(value) => (
                <span style={{ color: "var(--foreground)" }}>{value}</span>
              )}
            />
            {includeBaseline && (
              <Area
                type="monotone"
                dataKey="baseline"
                stackId="1"
                stroke={CHANNEL_COLORS.baseline}
                fill={CHANNEL_COLORS.baseline}
                fillOpacity={0.6}
                strokeWidth={2}
              />
            )}
            {selectedChannels.map((channel) => (
              <Area
                key={channel}
                type="monotone"
                dataKey={channel}
                stackId="1"
                stroke={CHANNEL_COLORS[channel as keyof typeof CHANNEL_COLORS]}
                fill={CHANNEL_COLORS[channel as keyof typeof CHANNEL_COLORS]}
                fillOpacity={0.7}
                strokeWidth={2}
              />
            ))}
            <Brush
              dataKey="time"
              height={30}
              stroke="var(--chart-1)"
              fill="var(--muted)"
              tickFormatter={(value) =>
                new Date(value).toLocaleDateString("en-US", { month: "short" })
              }
            />
          </AreaChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}
