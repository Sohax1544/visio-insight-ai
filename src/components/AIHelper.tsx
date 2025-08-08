import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function AIHelper({ tableSummary, onApply }: { tableSummary: string; onApply: (cmd: string) => void }) {
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
  );
}
