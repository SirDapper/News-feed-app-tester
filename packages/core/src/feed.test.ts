import { test } from "node:test";
import assert from "node:assert/strict";
import { feedRequestUrl, rowToStory } from "./feed.ts";

const config = { url: "https://abcd.supabase.co/", key: "sb_publishable_x" };

test("feed URL without a command has no filter", () => {
  const url = new URL(feedRequestUrl(config));
  assert.equal(url.origin + url.pathname, "https://abcd.supabase.co/rest/v1/stories");
  assert.equal(url.searchParams.get("order"), "updated_at.desc");
  assert.equal(url.searchParams.get("cmd.command_id"), null);
  assert.ok(!url.searchParams.get("select")!.includes("!inner"));
});

test("feed URL for a command filters through an inner join", () => {
  const url = new URL(feedRequestUrl(config, "EUCOM"));
  assert.equal(url.searchParams.get("cmd.command_id"), "eq.EUCOM");
  assert.ok(url.searchParams.get("select")!.endsWith(",cmd:story_commands!inner(command_id)"));
});

test("rows map to stories, falling back when a source row is missing", () => {
  const story = rowToStory({
    id: "1",
    title: "T",
    summary: "S",
    primary_command: "CENTCOM",
    countries: null,
    severity: 9,
    updated_at: "2026-10-26T12:00:00+00:00",
    story_commands: [{ command_id: "CENTCOM" }, { command_id: "AFRICOM" }],
    items: [
      { url: "https://a", source_id: "bbc-world", sources: { name: "BBC World", trust: "outlet" } },
      { url: "https://b", source_id: "gone", sources: null },
    ],
  });
  assert.deepEqual(story.commands, ["CENTCOM", "AFRICOM"]);
  assert.equal(story.severity, 5);
  assert.equal(story.updatedAt, "2026-10-26T12:00:00.000Z");
  assert.deepEqual(story.sources[1], { name: "gone", url: "https://b", trust: "outlet" });
});
