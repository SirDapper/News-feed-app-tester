import Anthropic from "@anthropic-ai/sdk";
import type { Item, Source } from "@newsapp/core";

const client = new Anthropic();
const MODEL = process.env.SUMMARY_MODEL ?? "claude-opus-5-5";

const SYSTEM = `You write short, neutral summaries for a military and world-affairs news app.
Use only the source excerpts given; add no outside facts.
Write 2 to 4 sentences: what happened, where, and who reported it.
Attribute casualty figures and claims of responsibility to their source.
If a claim comes only from an unverified social source, say it is unconfirmed.
Return plain text with no heading.`;

/** Summarizes one story cluster from its items. Returns null if the model declines. */
export async function summarize(items: Item[], sources: Map<string, Source>): Promise<string | null> {
  const excerpts = items
    .map((i) => {
      const s = sources.get(i.sourceId);
      return `Source: ${s?.name ?? i.sourceId} (${s?.trust ?? "unknown"})\nTitle: ${i.title}\nExcerpt: ${i.summary}`;
    })
    .join("\n\n");

  // Thinking is always on and is billed against max_tokens, so leave room for
  // it: a ceiling too low gets spent on reasoning before any text is written.
  const response = await client.beta.messages.create({
    model: MODEL,
    max_tokens: 16000,
    output_config: { effort: "low" },
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    system: SYSTEM,
    messages: [{ role: "user", content: excerpts }],
  });

  if (response.stop_reason === "refusal") return null;
  if (response.stop_reason === "max_tokens") {
    // A cut-off summary would be stored as if complete; fall back to the excerpt.
    console.warn(`summary hit max_tokens for ${items[0]?.url}`);
    return null;
  }
  const text = response.content
    .flatMap((block) => (block.type === "text" ? [block.text] : []))
    .join("")
    .trim();
  return text || null;
}
