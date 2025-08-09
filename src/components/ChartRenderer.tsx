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

// CSS HSL variable helper for canvas colors
function hslVar(name: string, alpha?: number, fallback?: string) {
  try {
    const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    if (!v) return fallback || "#00e5ff";
    return `hsl(${v}${alpha !== undefined ? ` / ${alpha}` : ""})`;
  } catch {
    return fallback || "#00e5ff";
  }
}
const neonVars = ["--chart-neon-1","--chart-neon-2","--chart-neon-3","--chart-neon-4","--chart-neon-5"] as const;
const colorfulVars = ["--chart-color-1","--chart-color-2","--chart-color-3","--chart-color-4","--chart-color-5","--chart-color-6"] as const;

export interface ChartRendererProps {
  table: DataTable;
  chart: ChartKind;
  xField?: string;
  yField?: string;
  y2Field?: string; // for combo
  colorVar?: string; // CSS var like --chart-neon-3
  customHex?: string; // e.g., #22c55e
  opacity?: number; // 0.1 - 1
  palette?: 'neon' | 'colorful' | 'monochrome';
  perValueColors?: Record<string, string>; // label -> hex
}

function hexToRgba(hex: string, alpha: number = 1) {
  let h = hex.replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${Math.max(0, Math.min(1, alpha))})`;
}

function extractNumericColumns(table: DataTable) {
  return table.headers.filter((h) => table.rows.some((r) => typeof r[h] === "number"));
}
function extractCategoricalColumns(table: DataTable) {
  return table.headers.filter((h) => table.rows.some((r) => typeof r[h] === "string"));
}

export const ChartRenderer: React.FC<ChartRendererProps> = ({ table, chart, xField, yField, y2Field, colorVar, customHex, opacity, palette = 'neon', perValueColors }) => {
  const chartRef = useRef<any>(null);

  const numericCols = useMemo(() => extractNumericColumns(table), [table]);
  const catCols = useMemo(() => extractCategoricalColumns(table), [table]);

  const x = xField || catCols[0] || table.headers[0];
  const y = yField || numericCols[0] || table.headers[1];

  const labels = table.rows.map((r, i) => (r[x] ?? `Row ${i + 1}`) as any);
  const values = table.rows.map((r) => (typeof r[y] === "number" ? (r[y] as number) : NaN));

  const alphaBase = 1; // lock to 100% opacity
  const fromUser = (fallbackVar: string, a: number) => {
    if (customHex) return hexToRgba(customHex, a);
    if (colorVar) return hslVar(colorVar, a);
    return hslVar(fallbackVar, a);
  };
  const colorFor = (index: number, label: string | number, a: number) => {
    const key = String(label);
    if (perValueColors && perValueColors[key]) return hexToRgba(perValueColors[key], a);
    if (customHex) return hexToRgba(customHex, a);
    if (colorVar) return hslVar(colorVar, a);
    if (palette === 'colorful') return hslVar(colorfulVars[index % colorfulVars.length], a);
    if (palette === 'monochrome') {
      // vary only by alpha for subtle depth
      const scale = 0.6 + (index % 6) * 0.07; // 0.6 - 1.0
      return hslVar('--primary', Math.max(0.05, Math.min(1, a * scale)));
    }
    return hslVar(neonVars[index % neonVars.length], a);
  };

  const commonOptions: any = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: chart !== "table", labels: { color: hslVar("--foreground") } },
      title: { display: false },
    },
    scales: {
      x: { grid: { color: hslVar("--foreground", 0.16) }, ticks: { color: hslVar("--foreground") } },
      y: { grid: { color: hslVar("--foreground", 0.16) }, ticks: { color: hslVar("--foreground") } },
    },
  };

  if (chart === "pie") {
    const data = {
      labels,
      datasets: [
        {
          label: y,
          data: values,
          backgroundColor: labels.map((lbl, i) => colorFor(i, lbl, 1)),
          borderColor: hslVar("--foreground", 0.15),
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
          borderColor: fromUser("--chart-neon-1", 1),
          backgroundColor: fromUser("--chart-neon-1", 1),
          tension: 0.35,
          fill: true,
          pointRadius: 4,
          pointBackgroundColor: labels.map((lbl, i) => colorFor(i, lbl, 1)),
          pointBorderColor: labels.map((lbl, i) => colorFor(i, lbl, 1)),
        },
      ],
    };
    return <div className="h-[420px]"><Line ref={chartRef} data={data} options={commonOptions} /></div>;
  }

  if (chart === "scatter") {
    if (numericCols.length === 0) {
      return <div className="h-[420px] flex items-center justify-center text-sm text-muted-foreground">Scatter requires at least one numeric column.</div>;
    }
    const xNum = numericCols[0];
    const yNum = numericCols[1] || numericCols[0];
    const data = {
      datasets: [
        {
          label: `${xNum} vs ${yNum}`,
          data: table.rows
            .filter((r) => typeof r[xNum] === "number" && typeof r[yNum] === "number")
            .map((r) => ({ x: r[xNum] as number, y: r[yNum] as number })),
          backgroundColor: table.rows
            .filter((r) => typeof r[xNum] === "number" && typeof r[yNum] === "number")
            .map((r, i) => colorFor(i, (r[x] ?? `Row ${i + 1}`) as any, Math.max(0.2, alphaBase))),
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
          backgroundColor: (ctx: any) => fromUser("--chart-neon-3", 1),
          width: ({ chart }: any) => (chart.chartArea?.width || 1) / xCats.length - 2,
          height: ({ chart }: any) => (chart.chartArea?.height || 1) / yCats.length - 2,
          borderWidth: 1,
          borderColor: hslVar("--border"),
        } as any,
      ],
    } as any;

    const options = {
      ...commonOptions,
      scales: {
        x: { ticks: { color: hslVar("--foreground", 0.9) } },
        y: { ticks: { color: hslVar("--foreground", 0.9) } },
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
           backgroundColor: labels.map((lbl, i) => colorFor(i, lbl, alphaBase)),
           borderColor: labels.map((lbl, i) => colorFor(i, lbl, 1)),
        },
        y2 && {
          type: "line" as const,
          label: y2,
          data: table.rows.map((r) => (typeof r[y2] === "number" ? (r[y2] as number) : NaN)),
          borderColor: hslVar("--chart-neon-1"),
          backgroundColor: hslVar("--chart-neon-1", 1),
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
          backgroundColor: sorted.map((s, i) => colorFor(i, s.label, 1)),
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
        backgroundColor: labels.map((lbl, i) => colorFor(i, lbl, alphaBase)),
        borderColor: labels.map((lbl, i) => colorFor(i, lbl, 1)),
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


