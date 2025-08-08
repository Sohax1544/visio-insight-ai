import React, { useMemo, useRef } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Tooltip,
  Legend,
  Title,
} from "chart.js";
import { Bar, Line, Pie, Scatter } from "react-chartjs-2";
import { MatrixController, MatrixElement } from "chartjs-chart-matrix";
import type { ChartKind, DataTable } from "@/types/data";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Tooltip,
  Legend,
  Title,
  MatrixController,
  MatrixElement
);

export interface ChartRendererProps {
  table: DataTable;
  chart: ChartKind;
  xField?: string;
  yField?: string;
  y2Field?: string; // for combo
}

function extractNumericColumns(table: DataTable) {
  return table.headers.filter((h) => table.rows.some((r) => typeof r[h] === "number"));
}

function extractCategoricalColumns(table: DataTable) {
  return table.headers.filter((h) => table.rows.some((r) => typeof r[h] === "string"));
}

export const ChartRenderer: React.FC<ChartRendererProps> = ({ table, chart, xField, yField, y2Field }) => {
  const chartRef = useRef<any>(null);

  const numericCols = useMemo(() => extractNumericColumns(table), [table]);
  const catCols = useMemo(() => extractCategoricalColumns(table), [table]);

  const x = xField || catCols[0] || table.headers[0];
  const y = yField || numericCols[0] || table.headers[1];

  const labels = table.rows.map((r, i) => (r[x] ?? `Row ${i + 1}`) as any);
  const values = table.rows.map((r) => (typeof r[y] === "number" ? (r[y] as number) : NaN));

  const commonOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: chart !== "table" },
      title: { display: false },
    },
    scales: {
      x: { grid: { color: "hsl(var(--border))" }, ticks: { color: "hsl(var(--muted-foreground))" } },
      y: { grid: { color: "hsl(var(--border))" }, ticks: { color: "hsl(var(--muted-foreground))" } },
    },
  };

  if (chart === "pie") {
    const data = {
      labels,
      datasets: [
        {
          label: y,
          data: values,
          backgroundColor: labels.map((_, i) => `hsl(var(--primary) / ${0.15 + (i % 6) * 0.12})`),
          borderColor: "hsl(var(--border))",
        },
      ],
    };
    return <div className="h-[420px]"><Pie ref={chartRef} data={data} options={commonOptions} /></div>;
  }

  if (chart === "line") {
    const data = {
      labels,
      datasets: [
        {
          label: y,
          data: values,
          borderColor: "hsl(var(--sidebar-ring))",
          backgroundColor: "hsl(var(--sidebar-ring) / 0.25)",
          tension: 0.35,
          fill: true,
          pointRadius: 3,
        },
      ],
    };
    return <div className="h-[420px]"><Line ref={chartRef} data={data} options={commonOptions} /></div>;
  }

  if (chart === "scatter") {
    const xNum = numericCols[0];
    const yNum = numericCols[1] || numericCols[0];
    const data = {
      datasets: [
        {
          label: `${xNum} vs ${yNum}`,
          data: table.rows
            .filter((r) => typeof r[xNum] === "number" && typeof r[yNum] === "number")
            .map((r) => ({ x: r[xNum] as number, y: r[yNum] as number })),
          backgroundColor: "hsl(var(--sidebar-ring) / 0.6)",
        },
      ],
    } as any;
    return <div className="h-[420px]"><Scatter ref={chartRef} data={data} options={commonOptions} /></div>;
  }

  if (chart === "heatmap") {
    // Build matrix dataset: x = category index, y = category index, v = numeric
    const xCats = catCols[0] ? Array.from(new Set(table.rows.map((r) => r[catCols[0]] as string))) : labels as string[];
    const yCats = catCols[1] ? Array.from(new Set(table.rows.map((r) => r[catCols[1]] as string))) : ["Value"];
    const valueCol = numericCols[0];

    const data = {
      labels: xCats,
      datasets: [
        {
          label: valueCol,
          data: yCats.flatMap((yc, yi) =>
            xCats.map((xc, xi) => ({ x: xi, y: yi, v: (table.rows.find((r) => r[catCols[0]] === xc && (!catCols[1] || r[catCols[1]] === yc))?.[valueCol] as number) || 0 }))
          ),
          backgroundColor: (ctx: any) => {
            const v = ctx.raw?.v ?? 0;
            const alpha = Math.max(0.05, Math.min(1, v / (Math.max(...values) || 1)));
            return `hsl(var(--primary) / ${alpha})`;
          },
          width: ({ chart }: any) => (chart.chartArea?.width || 1) / xCats.length - 2,
          height: ({ chart }: any) => (chart.chartArea?.height || 1) / yCats.length - 2,
          borderWidth: 1,
          borderColor: "hsl(var(--border))",
        } as any,
      ],
    } as any;

    const options = {
      ...commonOptions,
      scales: {
        x: { ticks: { color: "hsl(var(--muted-foreground))" } },
        y: { ticks: { color: "hsl(var(--muted-foreground))" } },
      },
      plugins: { legend: { display: false } },
    } as any;

    // @ts-ignore matrix controller rendering through Bar wrapper is not correct; use as any
    return <div className="h-[420px]"><Bar ref={chartRef} data={data} options={options} /></div>;
  }

  if (chart === "combo") {
    const y2 = y2Field || numericCols[1];
    const data = {
      labels,
      datasets: [
        {
          type: "bar" as const,
          label: y,
          data: values,
          backgroundColor: "hsl(var(--primary) / 0.5)",
          borderColor: "hsl(var(--primary))",
        },
        y2 && {
          type: "line" as const,
          label: y2,
          data: table.rows.map((r) => (typeof r[y2] === "number" ? (r[y2] as number) : NaN)),
          borderColor: "hsl(var(--sidebar-ring))",
          backgroundColor: "hsl(var(--sidebar-ring) / 0.2)",
          tension: 0.35,
          yAxisID: "y",
        },
      ].filter(Boolean),
    } as any;
    return <div className="h-[420px]"><Bar ref={chartRef} data={data} options={commonOptions} /></div>;
  }

  if (chart === "funnel") {
    // Simulate funnel using horizontal bar with decreasing widths
    const sorted = [...table.rows]
      .map((r, i) => ({ label: (r[x] ?? `Step ${i + 1}`) as string, value: (typeof r[y] === "number" ? (r[y] as number) : 0) }))
      .sort((a, b) => b.value - a.value);
    const data = {
      labels: sorted.map((s) => s.label),
      datasets: [
        {
          label: y,
          data: sorted.map((s) => s.value),
          backgroundColor: sorted.map((_, i) => `hsl(var(--primary) / ${0.6 - i * 0.05})`),
          borderRadius: 16,
          barThickness: (ctx: any) => {
            const max = Math.max(...sorted.map((s) => s.value)) || 1;
            const v = sorted[ctx.dataIndex]?.value || 0;
            const pct = v / max;
            return Math.max(24, 48 * pct);
          },
        } as any,
      ],
    } as any;
    const options = { ...commonOptions, indexAxis: "y" as const };
    return <div className="h-[420px]"><Bar ref={chartRef} data={data} options={options} /></div>;
  }

  // column or bar default
  const isBar = chart === "bar";
  const options = { ...commonOptions, indexAxis: isBar ? ("y" as const) : ("x" as const) };
  const data = {
    labels,
    datasets: [
      {
        label: y,
        data: values,
        backgroundColor: isBar ? "hsl(var(--accent) / 0.5)" : "hsl(var(--primary) / 0.5)",
        borderColor: isBar ? "hsl(var(--accent))" : "hsl(var(--primary))",
      },
    ],
  };
  return <div className="h-[420px]"><Bar ref={chartRef} data={data} options={options} /></div>;
};

export function downloadChartPng(canvasId: string) {
  const canvas = document.getElementById(canvasId) as HTMLCanvasElement | null;
  if (!canvas) return;
  const a = document.createElement("a");
  a.href = canvas.toDataURL("image/png", 1.0);
  a.download = `chart-${Date.now()}.png`;
  a.click();
}
