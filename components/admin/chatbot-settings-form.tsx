"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/shared/toast";
import { useAsyncData } from "@/lib/store/hooks";
import { getChatSettings, saveChatSettings } from "@/services/chatbot";

export function ChatbotSettingsForm() {
  const { toast } = useToast();
  const { data, loading, error } = useAsyncData(getChatSettings);
  const [greeting, setGreeting] = React.useState("");
  const [chips, setChips] = React.useState("");
  const [whatsapp, setWhatsapp] = React.useState("");
  const [ai, setAi] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (!data) return;
    /* eslint-disable react-hooks/set-state-in-effect */
    setGreeting(data.greeting);
    setChips(data.welcomeChips.join(", "));
    setWhatsapp(data.whatsapp);
    setAi(data.aiInstructions);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [data]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const result = await saveChatSettings({
      greeting,
      welcomeChips: chips.split(","),
      whatsapp,
      aiInstructions: ai,
    });
    setSaving(false);
    if (result.ok) toast("Chatbot settings saved. Live within a minute.");
    else toast(result.error, "error");
  }

  if (loading) return <p className="text-sm text-muted-foreground">Loading settings…</p>;
  if (error) return <p className="text-sm text-destructive">{error}</p>;

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4 rounded-xl border border-border bg-background p-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="cb-greeting">Greeting</Label>
        <Textarea id="cb-greeting" rows={2} value={greeting} onChange={(e) => setGreeting(e.target.value)} />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="cb-chips">Starting buttons</Label>
        <Input id="cb-chips" value={chips} onChange={(e) => setChips(e.target.value)} placeholder="Get a quote, Delivery, Products, Talk to expert" />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="cb-wa">WhatsApp number</Label>
        <Input id="cb-wa" inputMode="numeric" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="14165551234" />
        <p className="text-xs text-muted-foreground">Digits only, with country code (1 for Canada).</p>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="cb-ai">Extra instructions for the AI</Label>
        <Textarea
          id="cb-ai"
          rows={6}
          value={ai}
          onChange={(e) => setAi(e.target.value)}
          placeholder={"Tone and behaviour, not facts (facts go in the knowledge base). e.g.\n- Always suggest the free estimate for renovation questions.\n- Mention the contractor account when someone says they are a builder."}
        />
      </div>
      <div className="flex justify-end">
        <Button type="submit" disabled={saving}>
          {saving ? <Loader2 className="size-4 animate-spin" /> : "Save settings"}
        </Button>
      </div>
    </form>
  );
}
