import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import type { ChartKind, ParsedResult } from "@/types/data";
import { suggestChartType } from "@/utils/parseData";
import { ChartRenderer } from "@/components/ChartRenderer";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Copy, Download, Share2 } from "lucide-react";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";

const chartTypes: { value: ChartKind; label: string }[] = [
  { value: "column", label: "Column" },
  { value: "bar", label: "Bar" },
  { value: "line", label: "Line" },
  { value: "combo", label: "Combo" },
  { value: "pie", label: "Pie" },
  { value: "heatmap", label: "Heatmap" },
  { value: "table", label: "Table" },
  { value: "funnel", label: "Funnel" },
  { value: "scatter", label: "Scatter" },
];

export default function Builder() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as ParsedResult | undefined;

  const initialType = useMemo(() => {
    if (!state) return "table" as ChartKind;
    return suggestChartType(state.table.headers, state.table.rows) as ChartKind;
  }, [state]);

  const [chart, setChart] = useState<ChartKind>(initialType);
  const [xField, setXField] = useState<string | undefined>(undefined);
  const [yField, setYField] = useState<string | undefined>(undefined);
  const [y2Field, setY2Field] = useState<string | undefined>(undefined);
  const [colorVar, setColorVar] = useState<string | undefined>(undefined);
  const [customHex, setCustomHex] = useState<string>("");
  const [opacity, setOpacity] = useState<number>(0.35);
  const [palette, setPalette] = useState<'neon' | 'colorful' | 'monochrome'>("neon");
  const [perValueColors, setPerValueColors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!state) {
      navigate("/", { replace: true });
    }
  }, [state, navigate]);

  if (!state) {
    return (
      <main className="min-h-screen bg-background">
        <div className="container py-10">
          <h1 className="mb-2 text-2xl font-semibold">No data loaded</h1>
          <p className="mb-6 text-muted-foreground">Please go back and upload a CSV/XLSX file to start building charts.</p>
          <Button variant="secondary" onClick={() => navigate("/")}>Go to Upload</Button>
        </div>
      </main>
    );
  }

  const headers = state.table.headers;

  // Determine labels for per-value color editing
  const xSel = xField || (state.table.headers.find((h) => state.table.rows.some((r) => typeof r[h] === 'string')) ?? state.table.headers[0]);
  const rowLabels = state.table.rows.map((r, i) => String(r[xSel] ?? `Row ${i + 1}`));
  const uniqueLabels = Array.from(new Set(rowLabels)).slice(0, 50);

  const setLabelColor = (label: string, hex: string) => {
    setPerValueColors((prev) => {
      const next = { ...prev };
      if (!hex) delete next[label]; else next[label] = hex;
      return next;
    });
  };

  const copyEmbed = async () => {
    const code = `<iframe src="${window.location.origin}" title="Chart" style="width:100%;height:480px;border:0"></iframe>`;
    await navigator.clipboard.writeText(code);
    alert("Embed code copied to clipboard");
  };

  const shareConfig = async () => {
    const payload = { chart, xField, yField, y2Field, data: state.table };
    const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
    await navigator.clipboard.writeText(encoded);
    alert("Share token copied. Paste it later to restore.");
  };

  return (
    <main className="min-h-screen bg-background">
      <Helmet>
        <title>Chart Builder – Visualize your data</title>
        <meta name="description" content="Upload data and build interactive charts with Chart.js" />
        <link rel="canonical" href={`${window.location.origin}/builder`} />
      </Helmet>
      <div className="container py-6">
        <h1 className="mb-4 text-3xl font-bold">Chart Builder</h1>

        <ResizablePanelGroup direction="horizontal" className="min-h-[720px] rounded-lg border">
          {/* Left: AI Assistant */}
          <ResizablePanel defaultSize={24} minSize={16} className="p-3">
            <AIHelper
              tableSummary={`${state.table.headers.join(", ")} with ${state.table.rows.length} rows`}
              onApply={(cmd) => {
                const c = cmd.toLowerCase();
                if (c.includes("pie")) setChart("pie");
                else if (c.includes("line")) setChart("line");
                else if (c.includes("bar")) setChart("bar");
                else if (c.includes("column")) setChart("column");
                else if (c.includes("scatter")) setChart("scatter");
                else if (c.includes("funnel")) setChart("funnel");
                else if (c.includes("heat")) setChart("heatmap");
              }}
            />
          </ResizablePanel>
          <ResizableHandle withHandle />

          {/* Middle: Chart Display */}
          <ResizablePanel defaultSize={52} minSize={30} className="p-3">
            <Card className="h-full">
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle>{state.sourceName || "Dataset"}</CardTitle>
                <div className="flex gap-2">
                  <Button variant="secondary" onClick={copyEmbed}><Copy className="mr-2 h-4 w-4"/>Embed</Button>
                  <Button variant="secondary" onClick={shareConfig}><Share2 className="mr-2 h-4 w-4"/>Share</Button>
                  <Button onClick={() => window.print()}><Download className="mr-2 h-4 w-4"/>Download</Button>
                </div>
              </CardHeader>
              <CardContent>
                {chart === "table" ? (
                  <div className="max-h-[560px] overflow-auto rounded-md border border-border">
                    <table className="w-full text-sm">
                      <thead className="bg-secondary/30">
                        <tr>
                          {state.table.headers.map((h) => (
                            <th key={h} className="px-3 py-2 text-left font-medium">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {state.table.rows.map((r, i) => (
                          <tr key={i} className="even:bg-secondary/10">
                            {state.table.headers.map((h) => (
                              <td key={h} className="px-3 py-2">{String(r[h] ?? "")}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="h-[600px]">
                    <ChartRenderer
                      table={state.table}
                      chart={chart}
                      xField={xField}
                      yField={yField}
                      y2Field={y2Field}
                      colorVar={colorVar}
                      customHex={customHex}
                      opacity={opacity}
                      palette={palette}
                      perValueColors={perValueColors}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </ResizablePanel>
          <ResizableHandle withHandle />

          {/* Right: Configure */}
          <ResizablePanel defaultSize={24} minSize={16} className="p-3">
            <Card className="h-full">
              <CardHeader>
                <CardTitle>Configure</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 overflow-auto">
                <div>
                  <label className="mb-1 block text-sm text-muted-foreground">Chart type</label>
                  <Select value={chart} onValueChange={(v) => setChart(v as ChartKind)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select chart" />
                    </SelectTrigger>
                    <SelectContent>
                      {chartTypes.map((t) => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="mb-1 block text-sm text-muted-foreground">X field</label>
                  <select className="w-full rounded-md border border-input bg-background p-2" value={xField} onChange={(e) => setXField(e.target.value)}>
                    <option value="">Auto</option>
                    {headers.map((h) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm text-muted-foreground">Y field</label>
                  <select className="w-full rounded-md border border-input bg-background p-2" value={yField} onChange={(e) => setYField(e.target.value)}>
                    <option value="">Auto</option>
                    {headers.map((h) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>
                {chart === "combo" && (
                  <div>
                    <label className="mb-1 block text-sm text-muted-foreground">Y2 field (line)</label>
                    <select className="w-full rounded-md border border-input bg-background p-2" value={y2Field} onChange={(e) => setY2Field(e.target.value)}>
                      <option value="">Auto</option>
                      {headers.map((h) => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Palette options */}
                <div className="pt-2">
                  <label className="mb-1 block text-sm text-muted-foreground">Palette</label>
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <Button variant={palette==='monochrome'? 'default':'secondary'} size="sm" onClick={() => setPalette('monochrome')}>Monochrome</Button>
                    <Button variant={palette==='colorful'? 'default':'secondary'} size="sm" onClick={() => setPalette('colorful')}>Colorful</Button>
                    <Button variant={palette==='neon'? 'default':'secondary'} size="sm" onClick={() => setPalette('neon')}>Neon</Button>
                  </div>

                  {/* Base color */}
                  <label className="mb-1 block text-sm text-muted-foreground">Base color</label>
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <button type="button" aria-label="Theme default" onClick={() => { setColorVar(undefined); setCustomHex(""); }}
                      className={`h-8 rounded border px-2 text-xs ${!colorVar && !customHex ? 'ring-2 ring-ring' : ''}`}>Theme</button>
                    <button type="button" aria-label="Neon 1" onClick={() => { setColorVar("--chart-neon-1"); setCustomHex(""); }}
                      className={`h-6 w-6 rounded-full border ${colorVar === "--chart-neon-1" ? 'ring-2 ring-ring' : ''}`}
                      style={{ backgroundColor: `hsl(var(--chart-neon-1))` }} />
                    <button type="button" aria-label="Neon 2" onClick={() => { setColorVar("--chart-neon-2"); setCustomHex(""); }}
                      className={`h-6 w-6 rounded-full border ${colorVar === "--chart-neon-2" ? 'ring-2 ring-ring' : ''}`}
                      style={{ backgroundColor: `hsl(var(--chart-neon-2))` }} />
                    <button type="button" aria-label="Neon 3" onClick={() => { setColorVar("--chart-neon-3"); setCustomHex(""); }}
                      className={`h-6 w-6 rounded-full border ${colorVar === "--chart-neon-3" ? 'ring-2 ring-ring' : ''}`}
                      style={{ backgroundColor: `hsl(var(--chart-neon-3))` }} />
                    <button type="button" aria-label="Neon 4" onClick={() => { setColorVar("--chart-neon-4"); setCustomHex(""); }}
                      className={`h-6 w-6 rounded-full border ${colorVar === "--chart-neon-4" ? 'ring-2 ring-ring' : ''}`}
                      style={{ backgroundColor: `hsl(var(--chart-neon-4))` }} />
                    <button type="button" aria-label="Neon 5" onClick={() => { setColorVar("--chart-neon-5"); setCustomHex(""); }}
                      className={`h-6 w-6 rounded-full border ${colorVar === "--chart-neon-5" ? 'ring-2 ring-ring' : ''}`}
                      style={{ backgroundColor: `hsl(var(--chart-neon-5))` }} />
                  </div>
                  <div className="mb-2 flex items-center gap-2">
                    <Input placeholder="#22c55e" value={customHex} onChange={(e) => { setCustomHex(e.target.value); if (e.target.value) setColorVar(undefined); }} />
                    {customHex && (
                      <Button variant="secondary" onClick={() => setCustomHex("")}>Clear</Button>
                    )}
                  </div>
                  <div>
                    <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                      <span>Opacity</span>
                      <span>{Math.round((opacity ?? 0.35) * 100)}%</span>
                    </div>
                    <Slider value={[opacity]} min={0.05} max={1} step={0.05} onValueChange={(v) => setOpacity(v[0] ?? 0.35)} />
                  </div>
                </div>

                {/* Per-value colors */}
                <div className="pt-2">
                  <div className="mb-2 flex items-center justify-between">
                    <label className="block text-sm text-muted-foreground">Per-value colors</label>
                    <Button variant="secondary" size="sm" onClick={() => setPerValueColors({})}>Reset all</Button>
                  </div>
                  <div className="max-h-64 space-y-2 overflow-auto pr-1">
                    {uniqueLabels.map((lbl) => (
                      <div key={lbl} className="flex items-center gap-2">
                        <input
                          aria-label={`Color for ${lbl}`}
                          type="color"
                          className="h-6 w-6 cursor-pointer rounded border border-input bg-background"
                          value={perValueColors[lbl] || "#000000"}
                          onChange={(e) => setLabelColor(lbl, e.target.value)}
                        />
                        <span className="flex-1 truncate text-sm">{lbl}</span>
                        <Input
                          className="w-28"
                          placeholder="#000000"
                          value={perValueColors[lbl] || ""}
                          onChange={(e) => setLabelColor(lbl, e.target.value)}
                        />
                      </div>
                    ))}
                    {rowLabels.length > uniqueLabels.length && (
                      <p className="pt-1 text-xs text-muted-foreground">Showing first {uniqueLabels.length} values.</p>
                    )}
                  </div>
                </div>

                <div className="pt-4">
                  <Button variant="secondary" className="w-full" onClick={() => navigate("/")}>Back</Button>
                </div>
              </CardContent>
            </Card>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </main>
  );
}

function AIHelper({ tableSummary, onApply }: { tableSummary: string; onApply: (cmd: string) => void }) {
  const [apiKey, setApiKey] = useState<string>(() => localStorage.getItem("perplexity_key") || "");
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>([
    { role: "assistant", content: `I'm here to help explain your data (${tableSummary}) and suggest charts.` },
  ]);

  const ask = async () => {
    const question = input.trim();
    if (!question) return;
    setMessages((m) => [...m, { role: "user", content: question }]);
    setInput("");

    if (!apiKey) {
      // Heuristic fallback
      const reply = "Based on mixed numeric and categorical fields, a column or combo chart often works well. Try switching types via the selector.";
      setMessages((m) => [...m, { role: "assistant", content: reply }]);
      onApply(question);
      return;
    }

    try {
      const res = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.1-sonar-small-128k-online',
          messages: [
            { role: 'system', content: 'Be precise and concise. You are a data visualization expert using Chart.js.' },
            { role: 'user', content: `Dataset summary: ${tableSummary}. Question: ${question}` },
          ],
          temperature: 0.2,
          top_p: 0.9,
          max_tokens: 400,
        }),
      });
      const json = await res.json();
      const content = json?.choices?.[0]?.message?.content || 'Sorry, no reply.';
      setMessages((m) => [...m, { role: "assistant", content }]);
      onApply(question);
    } catch (e: any) {
      setMessages((m) => [...m, { role: "assistant", content: e?.message || 'Request failed.' }]);
    }
  };

  return (
    <section className="h-full">
      <Card className="h-full">
        <CardHeader>
          <CardTitle>AI Assistant</CardTitle>
        </CardHeader>
        <CardContent className="flex h-[calc(100%-4rem)] flex-col">
          <div className="mb-3 flex items-center gap-2">
            <Input placeholder="Optional: Perplexity API key" type="password" value={apiKey} onChange={(e) => { setApiKey(e.target.value); localStorage.setItem('perplexity_key', e.target.value); }} />
          </div>
          <div className="mb-3 max-h-60 flex-1 overflow-auto rounded-md border border-border p-3 text-sm">
            {messages.map((m, i) => (
              <div key={i} className={m.role === 'assistant' ? 'text-foreground' : 'text-muted-foreground'}>
                <strong className="mr-2 capitalize">{m.role}:</strong>{m.content}
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <Input placeholder="Ask about the data or give a command (e.g., change to pie chart)" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') ask(); }} />
            <Button onClick={ask}>Ask</Button>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
