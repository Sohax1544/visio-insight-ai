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
import { Switch } from "@/components/ui/switch";
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from "@/components/ui/breadcrumb";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";

import { Copy, Download, Share2, Ruler, BarChart3, Palette, Boxes, Pencil, Zap, Table as TableIcon, Home, Type, ArrowUpRight, Square, Highlighter, Target, TrendingUp, Sigma } from "lucide-react";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { AIHelper } from "@/components/AIHelper";

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

  // Size controls (UI only)
  const [sizeW, setSizeW] = useState<number>(967);
  const [sizeH, setSizeH] = useState<number>(663);

  // Graph options (UI only)
  const [donut, setDonut] = useState<boolean>(false);
  const [legendPos, setLegendPos] = useState<'top' | 'right' | 'none'>('top');
  const [headlinePos, setHeadlinePos] = useState<'none' | 'left' | 'center'>('none');
  const [dataLabels, setDataLabels] = useState<boolean>(true);
  const [showPercent, setShowPercent] = useState<boolean>(false);
  const [categoryLabels, setCategoryLabels] = useState<boolean>(false);
  const [abbrev, setAbbrev] = useState<'auto' | 'none' | 'short'>('auto');
  const [decimalPlaces, setDecimalPlaces] = useState<'auto' | 'fixed'>('auto');

  // Axes options (UI only)
  const [xVisible, setXVisible] = useState<boolean>(true);
  const [xPosition, setXPosition] = useState<'top' | 'bottom'>('bottom');
  const [xEndAt, setXEndAt] = useState<'auto' | 'data' | 'max'>('auto');

  // Color/style options (UI only)
  const [themeMode, setThemeMode] = useState<'light' | 'dark'>('dark');
  const [paletteTab, setPaletteTab] = useState<'preset' | 'brand' | 'freestyle'>('preset');
  const [chartBorder, setChartBorder] = useState<'none' | 'gradient' | 'solid'>('gradient');
  const [roundedCorners, setRoundedCorners] = useState<boolean>(true);
  const [chartBg, setChartBg] = useState<'black' | 'grey' | 'tint' | 'custom' | 'none'>('tint');

  // Elements options (UI only)
  const [showTitle, setShowTitle] = useState<boolean>(true);
  const [showSubtitle, setShowSubtitle] = useState<boolean>(true);
  const [showCaption, setShowCaption] = useState<boolean>(false);
  const [showSource, setShowSource] = useState<boolean>(false);
  const [showLogo, setShowLogo] = useState<boolean>(true);
  const [imageName, setImageName] = useState<string>("");
  const [fontChoice, setFontChoice] = useState<'modern'|'fresh'|'timeless'|'technical'>("modern");
  const [textScale, setTextScale] = useState<0.8|1|1.2|1.4|1.6>(1);

  // Power-ups (UI only)
  const [goalOn, setGoalOn] = useState<boolean>(false);
  const [trendOn, setTrendOn] = useState<boolean>(false);
  const [averageOn, setAverageOn] = useState<boolean>(false);

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
                <div className="space-y-1">
                  <Breadcrumb>
                    <BreadcrumbList>
                      <BreadcrumbItem>
                        <BreadcrumbLink href="/"><Home className="mr-1 inline h-4 w-4" />Home</BreadcrumbLink>
                      </BreadcrumbItem>
                      <BreadcrumbSeparator />
                      <BreadcrumbItem>
                        <BreadcrumbPage>{state.sourceName || "Example chart"}</BreadcrumbPage>
                      </BreadcrumbItem>
                    </BreadcrumbList>
                  </Breadcrumb>
                  <CardTitle className="text-xl">Example {chart} chart</CardTitle>
                </div>
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

          {/* Right: Toolbar */}
          <ResizablePanel defaultSize={10} minSize={8} className="p-3">
            <Card className="flex h-full w-full flex-col items-center justify-between rounded-xl p-2">
              <TooltipProvider>
                <div className="flex h-full flex-col items-center gap-2">
                  <Popover>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <PopoverTrigger asChild>
                          <Button variant="ghost" size="icon" className="rounded-lg">
                            <Ruler className="h-5 w-5" />
                          </Button>
                        </PopoverTrigger>
                      </TooltipTrigger>
                      <TooltipContent>Size</TooltipContent>
                    </Tooltip>
                    <PopoverContent side="left" align="center" className="w-80 p-4">
                      <div className="space-y-3">
                        <div className="text-sm font-medium">Presets</div>
                        <div className="grid gap-2">
                          <Button variant="secondary" className="justify-between" onClick={() => { setSizeW(1920); setSizeH(1080); }}>
                            <span>Google Slides / PowerPoint</span>
                            <span className="text-xs text-muted-foreground">16:9</span>
                          </Button>
                          <Button variant="secondary" className="justify-between" onClick={() => { setSizeW(1200); setSizeH(800); }}>
                            <span>Web / email</span>
                            <span className="text-xs text-muted-foreground">3:2</span>
                          </Button>
                          <Button variant="secondary" className="justify-between" onClick={() => { setSizeW(1200); setSizeH(628); }}>
                            <span>LinkedIn post</span>
                            <span className="text-xs text-muted-foreground">1.91:1</span>
                          </Button>
                          <Button variant="secondary" className="justify-between" onClick={() => { setSizeW(1080); setSizeH(1080); }}>
                            <span>Instagram post</span>
                            <span className="text-xs text-muted-foreground">1:1</span>
                          </Button>
                          <Button variant="secondary" className="justify-between" onClick={() => { setSizeW(1080); setSizeH(1920); }}>
                            <span>TikTok / Instagram story</span>
                            <span className="text-xs text-muted-foreground">9:16</span>
                          </Button>
                          <Button variant="secondary" className="justify-between" onClick={() => { setSizeW(1600); setSizeH(900); }}>
                            <span>X (Twitter)</span>
                            <span className="text-xs text-muted-foreground">16:9</span>
                          </Button>
                          <Button variant="secondary" className="justify-between" onClick={() => { setSizeW(1080); setSizeH(1920); }}>
                            <span>Mobile</span>
                            <span className="text-xs text-muted-foreground">9:16</span>
                          </Button>
                        </div>
                        <div className="text-sm font-medium pt-1">Custom size</div>
                        <div className="flex items-center gap-2">
                          <Input type="number" value={sizeW} onChange={(e) => setSizeW(parseInt(e.target.value || '0'))} />
                          <span className="text-xs text-muted-foreground">px</span>
                          <Input type="number" value={sizeH} onChange={(e) => setSizeH(parseInt(e.target.value || '0'))} />
                          <span className="text-xs text-muted-foreground">px</span>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>

                  <Popover>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <PopoverTrigger asChild>
                          <Button variant="ghost" size="icon" className="rounded-lg">
                            <BarChart3 className="h-5 w-5" />
                          </Button>
                        </PopoverTrigger>
                      </TooltipTrigger>
                      <TooltipContent>Graph</TooltipContent>
                    </Tooltip>
                    <PopoverContent side="left" align="center" className="w-[380px] p-4">
                      <div className="space-y-4">
                        <div className="grid grid-cols-3 gap-2">
                          {chartTypes.map((t) => (
                            <Button key={t.value} variant={chart === t.value ? 'default' : 'secondary'} size="sm" onClick={() => setChart(t.value)}>
                              {t.label}
                            </Button>
                          ))}
                        </div>

                        {chart === 'pie' && (
                          <div>
                            <div className="mb-2 text-sm font-medium">Pie chart appearance</div>
                            <div className="flex gap-2">
                              <Button size="sm" variant={!donut ? 'default':'secondary'} onClick={() => setDonut(false)}>Pie chart</Button>
                              <Button size="sm" variant={donut ? 'default':'secondary'} onClick={() => setDonut(true)}>Donut chart</Button>
                            </div>
                          </div>
                        )}

                        <div>
                          <div className="mb-2 text-sm font-medium">Legend</div>
                          <div className="flex gap-2">
                            <Button size="sm" variant={legendPos==='top'?'default':'secondary'} onClick={()=>setLegendPos('top')}>Top</Button>
                            <Button size="sm" variant={legendPos==='right'?'default':'secondary'} onClick={()=>setLegendPos('right')}>Right</Button>
                            <Button size="sm" variant={legendPos==='none'?'default':'secondary'} onClick={()=>setLegendPos('none')}>None</Button>
                          </div>
                        </div>

                        <div>
                          <div className="mb-2 text-sm font-medium">Headline number</div>
                          <div className="flex gap-2">
                            <Button size="sm" variant={headlinePos==='none'?'default':'secondary'} onClick={()=>setHeadlinePos('none')}>None</Button>
                            <Button size="sm" variant={headlinePos==='left'?'default':'secondary'} onClick={()=>setHeadlinePos('left')}>Left</Button>
                            <Button size="sm" variant={headlinePos==='center'?'default':'secondary'} onClick={()=>setHeadlinePos('center')}>Center</Button>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Data labels</span>
                            <Switch checked={dataLabels} onCheckedChange={setDataLabels} />
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm">% Show percentages</span>
                            <Switch checked={showPercent} onCheckedChange={setShowPercent} />
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Category labels</span>
                            <Switch checked={categoryLabels} onCheckedChange={setCategoryLabels} />
                          </div>
                        </div>

                        <div className="grid gap-2">
                          <div className="text-sm font-medium">Number format</div>
                          <div className="flex items-center gap-2">
                            <Select value={abbrev} onValueChange={(v)=>setAbbrev(v as typeof abbrev)}>
                              <SelectTrigger className="w-32">
                                <SelectValue placeholder="Auto" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="auto">Auto</SelectItem>
                                <SelectItem value="none">None</SelectItem>
                                <SelectItem value="short">Short</SelectItem>
                              </SelectContent>
                            </Select>
                            <div className="ml-auto flex gap-2">
                              <Button size="sm" variant={decimalPlaces==='auto'?'default':'secondary'} onClick={()=>setDecimalPlaces('auto')}>Auto</Button>
                              <Button size="sm" variant={decimalPlaces==='fixed'?'default':'secondary'} onClick={()=>setDecimalPlaces('fixed')}>Fixed</Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>

                  <Popover>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <PopoverTrigger asChild>
                          <Button variant="ghost" size="icon" className="rounded-lg">
                            <Ruler className="h-5 w-5" />
                          </Button>
                        </PopoverTrigger>
                      </TooltipTrigger>
                      <TooltipContent>Axes</TooltipContent>
                    </Tooltip>
                    <PopoverContent side="left" align="center" className="w-80 p-4">
                      <div className="space-y-3">
                        <div className="text-sm font-medium">X-Axis</div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Visible</span>
                          <div className="flex gap-2">
                            <Button size="sm" variant={!xVisible ? 'default':'secondary'} onClick={()=>setXVisible(false)}>No</Button>
                            <Button size="sm" variant={xVisible ? 'default':'secondary'} onClick={()=>setXVisible(true)}>Yes</Button>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">Position</span>
                          <div className="flex gap-2">
                            <Button size="sm" variant={xPosition==='top'?'default':'secondary'} onClick={()=>setXPosition('top')}>Top</Button>
                            <Button size="sm" variant={xPosition==='bottom'?'default':'secondary'} onClick={()=>setXPosition('bottom')}>Bottom</Button>
                          </div>
                        </div>
                        <div>
                          <div className="mb-1 text-sm">End at</div>
                          <Select value={xEndAt} onValueChange={(v)=>setXEndAt(v as typeof xEndAt)}>
                            <SelectTrigger>
                              <SelectValue placeholder="Auto" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="auto">Auto</SelectItem>
                              <SelectItem value="data">Data</SelectItem>
                              <SelectItem value="max">Max</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>

                  <Popover>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <PopoverTrigger asChild>
                          <Button variant="ghost" size="icon" className="rounded-lg">
                            <Palette className="h-5 w-5" />
                          </Button>
                        </PopoverTrigger>
                      </TooltipTrigger>
                      <TooltipContent>Color</TooltipContent>
                    </Tooltip>
                    <PopoverContent side="left" align="center" className="w-[420px] p-4">
                      <div className="space-y-4">
                        <div>
                          <div className="mb-2 text-sm font-medium">Theme</div>
                          <div className="flex gap-2">
                            <Button size="sm" variant={themeMode==='light'?'default':'secondary'} onClick={()=>setThemeMode('light')}>Light</Button>
                            <Button size="sm" variant={themeMode==='dark'?'default':'secondary'} onClick={()=>setThemeMode('dark')}>Dark</Button>
                          </div>
                        </div>

                        <div>
                          <div className="mb-2 text-sm font-medium">Palette</div>
                          <div className="mb-2 flex gap-2">
                            <Button size="sm" variant={paletteTab==='preset'?'default':'secondary'} onClick={()=>setPaletteTab('preset')}>Preset</Button>
                            <Button size="sm" variant={paletteTab==='brand'?'default':'secondary'} onClick={()=>setPaletteTab('brand')}>Brand kit</Button>
                            <Button size="sm" variant={paletteTab==='freestyle'?'default':'secondary'} onClick={()=>setPaletteTab('freestyle')}>Freestyle</Button>
                          </div>
                          <div className="mb-2 flex flex-wrap items-center gap-2">
                            <Button variant={palette==='monochrome'? 'default':'secondary'} size="sm" onClick={() => setPalette('monochrome')}>Monochrome</Button>
                            <Button variant={palette==='colorful'? 'default':'secondary'} size="sm" onClick={() => setPalette('colorful')}>Colorful</Button>
                            <Button variant={palette==='neon'? 'default':'secondary'} size="sm" onClick={() => setPalette('neon')}>Neon</Button>
                          </div>

                          <div>
                            <div className="mb-1 text-sm text-muted-foreground">Base color</div>
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
                        </div>

                        <div>
                          <div className="mb-2 text-sm font-medium">Chart border</div>
                          <div className="flex gap-2">
                            <Button size="sm" variant={chartBorder==='none'?'default':'secondary'} onClick={()=>setChartBorder('none')}>None</Button>
                            <Button size="sm" variant={chartBorder==='gradient'?'default':'secondary'} onClick={()=>setChartBorder('gradient')}>Gradient</Button>
                            <Button size="sm" variant={chartBorder==='solid'?'default':'secondary'} onClick={()=>setChartBorder('solid')}>Solid</Button>
                          </div>
                        </div>

                        <div>
                          <div className="mb-2 text-sm font-medium">Corners</div>
                          <div className="flex gap-2">
                            <Button size="sm" variant={roundedCorners?'default':'secondary'} onClick={()=>setRoundedCorners(true)}>Rounded corners</Button>
                            <Button size="sm" variant={!roundedCorners?'default':'secondary'} onClick={()=>setRoundedCorners(false)}>Sharp corners</Button>
                          </div>
                        </div>

                        <div>
                          <div className="mb-2 text-sm font-medium">Chart background</div>
                          <div className="flex flex-wrap gap-2">
                            {(['black','grey','tint','custom','none'] as const).map((bg) => (
                              <Button key={bg} size="sm" variant={chartBg===bg ? 'default':'secondary'} onClick={()=>setChartBg(bg)} className="capitalize">{bg}</Button>
                            ))}
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
                      </div>
                    </PopoverContent>
                  </Popover>

                  <Popover>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <PopoverTrigger asChild>
                          <Button variant="ghost" size="icon" className="rounded-lg">
                            <Boxes className="h-5 w-5" />
                          </Button>
                        </PopoverTrigger>
                      </TooltipTrigger>
                      <TooltipContent>Elements</TooltipContent>
                    </Tooltip>
                    <PopoverContent side="left" align="center" className="w-[420px] p-4">
                      <div className="space-y-4">
                        <div>
                          <div className="mb-2 text-sm font-medium">Header</div>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm">Title</span>
                              <div className="flex gap-2">
                                <Button size="sm" variant={showTitle ? 'default':'secondary'} onClick={()=>setShowTitle(true)}>Yes</Button>
                                <Button size="sm" variant={!showTitle ? 'default':'secondary'} onClick={()=>setShowTitle(false)}>No</Button>
                              </div>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm">Subtitle</span>
                              <div className="flex gap-2">
                                <Button size="sm" variant={showSubtitle ? 'default':'secondary'} onClick={()=>setShowSubtitle(true)}>Yes</Button>
                                <Button size="sm" variant={!showSubtitle ? 'default':'secondary'} onClick={()=>setShowSubtitle(false)}>No</Button>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div>
                          <div className="mb-2 text-sm font-medium">Footer</div>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm">Caption</span>
                              <div className="flex gap-2">
                                <Button size="sm" variant={showCaption ? 'default':'secondary'} onClick={()=>setShowCaption(true)}>Yes</Button>
                                <Button size="sm" variant={!showCaption ? 'default':'secondary'} onClick={()=>setShowCaption(false)}>No</Button>
                              </div>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm">Source</span>
                              <div className="flex gap-2">
                                <Button size="sm" variant={showSource ? 'default':'secondary'} onClick={()=>setShowSource(true)}>Yes</Button>
                                <Button size="sm" variant={!showSource ? 'default':'secondary'} onClick={()=>setShowSource(false)}>No</Button>
                              </div>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm">Logo</span>
                              <div className="flex gap-2">
                                <Button size="sm" variant={showLogo ? 'default':'secondary'} onClick={()=>setShowLogo(true)}>Yes</Button>
                                <Button size="sm" variant={!showLogo ? 'default':'secondary'} onClick={()=>setShowLogo(false)}>No</Button>
                              </div>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm">Image</span>
                              <Input type="file" className="w-40" onChange={(e)=>{ const f=e.target.files?.[0]; if(f){ setImageName(f.name); } }} />
                            </div>
                          </div>
                        </div>

                        <div>
                          <div className="mb-2 text-sm font-medium">Font</div>
                          <div className="grid grid-cols-4 gap-2">
                            {([
                              {k:'modern', label:'Modern'},
                              {k:'fresh', label:'Fresh'},
                              {k:'timeless', label:'Timeless'},
                              {k:'technical', label:'Technical'}
                            ] as const).map((f)=> (
                              <Button key={f.k} variant={fontChoice===f.k ? 'default':'secondary'} size="sm" onClick={()=>setFontChoice(f.k as typeof fontChoice)}>
                                Aa {f.label}
                              </Button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <div className="mb-2 text-sm font-medium">Text size</div>
                          <div className="flex flex-wrap gap-2">
                            {([0.8,1,1.2,1.4,1.6] as const).map((s) => (
                              <Button key={s} size="sm" variant={textScale===s? 'default':'secondary'} onClick={()=>setTextScale(s)}>
                                {s}x
                              </Button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>

                  <Popover>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <PopoverTrigger asChild>
                          <Button variant="ghost" size="icon" className="rounded-lg">
                            <Pencil className="h-5 w-5" />
                          </Button>
                        </PopoverTrigger>
                      </TooltipTrigger>
                      <TooltipContent>Annotate</TooltipContent>
                    </Tooltip>
                    <PopoverContent side="left" align="center" className="w-80 p-4">
                      <div className="space-y-3">
                        <div className="text-sm font-medium">Call-out</div>
                        <div className="grid grid-cols-2 gap-2">
                          <Button variant="secondary" className="h-16 justify-start gap-2">
                            <Type className="h-5 w-5" /> Text
                          </Button>
                          <Button variant="secondary" className="h-16 justify-start gap-2">
                            <ArrowUpRight className="h-5 w-5" /> Arrow
                          </Button>
                          <Button variant="secondary" className="h-16 justify-start gap-2 col-span-2">
                            <Square className="h-5 w-5" /> Box
                          </Button>
                        </div>
                        <div className="pt-2">
                          <Button variant="secondary" className="h-12 w-full justify-start gap-2">
                            <Highlighter className="h-5 w-5" /> Highlight
                          </Button>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>

                  <Popover>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <PopoverTrigger asChild>
                          <Button variant="ghost" size="icon" className="rounded-lg">
                            <Zap className="h-5 w-5" />
                          </Button>
                        </PopoverTrigger>
                      </TooltipTrigger>
                      <TooltipContent>Power-ups</TooltipContent>
                    </Tooltip>
                    <PopoverContent side="left" align="center" className="w-72 p-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2"><Target className="h-5 w-5" /><span className="text-sm">Goal</span></div>
                          <Switch checked={goalOn} onCheckedChange={setGoalOn} />
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2"><TrendingUp className="h-5 w-5" /><span className="text-sm">Trend</span></div>
                          <Switch checked={trendOn} onCheckedChange={setTrendOn} />
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2"><Sigma className="h-5 w-5" /><span className="text-sm">Average</span></div>
                          <Switch checked={averageOn} onCheckedChange={setAverageOn} />
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>

                  <Drawer>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <DrawerTrigger asChild>
                          <Button variant="ghost" size="icon" className="rounded-lg">
                            <TableIcon className="h-5 w-5" />
                          </Button>
                        </DrawerTrigger>
                      </TooltipTrigger>
                      <TooltipContent>Edit data</TooltipContent>
                    </Tooltip>
                    <DrawerContent className="h-[80vh]">
                      <DrawerHeader className="flex items-center justify-between">
                        <DrawerTitle>Edit data</DrawerTitle>
                        <span className="text-sm text-muted-foreground">{state.table.rows.length} rows</span>
                      </DrawerHeader>
                      <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-[1fr_360px]">
                        <div className="overflow-auto rounded-lg border">
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
                        <div className="space-y-4">
                          <div className="rounded-xl border p-3">
                            <div className="mb-2 text-sm font-medium">Preview</div>
                            <div className="h-40 w-full rounded-md border bg-background/50">
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
                          </div>
                          <div className="rounded-xl border p-3">
                            <div className="mb-2 text-sm font-medium">Chart type</div>
                            <div className="grid grid-cols-3 gap-2">
                              {chartTypes.map((t) => (
                                <Button key={t.value} variant={chart === t.value ? 'default' : 'secondary'} size="sm" onClick={() => setChart(t.value)}>
                                  {t.label}
                                </Button>
                              ))}
                            </div>
                            <div className="mt-3 text-sm font-medium">Bar chart appearance</div>
                            <div className="mt-1 flex gap-2">
                              <Button size="sm" variant="default">Grouped</Button>
                              <Button size="sm" variant="secondary">Stacked</Button>
                              <Button size="sm" variant="secondary">100% stacked</Button>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="border-t p-3 text-xs text-muted-foreground">
                        <div className="flex items-center gap-4">
                          <label className="inline-flex items-center gap-2"><input type="checkbox" className="accent-current" /> Swap rows and columns</label>
                          <button className="text-destructive" type="button">Clear table</button>
                        </div>
                      </div>
                    </DrawerContent>
                  </Drawer>
                </div>
              </TooltipProvider>
            </Card>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </main>
  );
}

