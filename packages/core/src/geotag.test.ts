import { test } from "node:test";
import assert from "node:assert/strict";
import { assignCommands, commandForCountry, COUNTRY_TO_COMMAND } from "./index.ts";

test("the table covers 200+ countries and territories", () => {
  assert.ok(COUNTRY_TO_COMMAND.size > 200);
});

test("border cases follow the Unified Command Plan", () => {
  assert.equal(commandForCountry("IL"), "CENTCOM");
  assert.equal(commandForCountry("EG"), "CENTCOM");
  assert.equal(commandForCountry("PK"), "CENTCOM");
  assert.equal(commandForCountry("IN"), "INDOPACOM");
  assert.equal(commandForCountry("GL"), "NORTHCOM");
  assert.equal(commandForCountry("RU"), "EUCOM");
});

test("primary command prefers the foreign country over the US", () => {
  const a = assignCommands("U.S. destroyer transits the Taiwan Strait as Beijing protests");
  assert.equal(a.primary, "INDOPACOM");
  assert.deepEqual(a.commands, ["INDOPACOM", "NORTHCOM"]);
});

test("multi-region stories land in each command", () => {
  const a = assignCommands("Houthi missiles target ships off Djibouti");
  assert.equal(a.primary, "CENTCOM");
  assert.ok(a.commands.includes("AFRICOM"));
});

test("space and cyber stories go to Global", () => {
  const a = assignCommands("Space Force launches a new satellite constellation");
  assert.ok(a.commands.includes("GLOBAL"));
});

test("short aliases do not match inside words", () => {
  assert.deepEqual(assignCommands("Discuss plans for the plaza").countries, []);
});

test("off-topic text is filed under no command at all", () => {
  const a = assignCommands("Local bakery wins an award");
  assert.deepEqual(a.commands, []);
  assert.deepEqual(a.countries, []);
});

test("countries whose formal names never appear in prose still match", () => {
  assert.equal(assignCommands("Myanmar junta launches airstrikes").primary, "INDOPACOM");
  assert.equal(assignCommands("Fighting intensifies around Goma in DR Congo").primary, "AFRICOM");
  assert.equal(assignCommands("Hong Kong police arrest activists").primary, "INDOPACOM");
});

test("names shared with US states and given names are not matched alone", () => {
  assert.deepEqual(assignCommands("A Georgia court ruled on the matter").countries, []);
  assert.deepEqual(assignCommands("Jordan scored 30 points for the Bulls").countries, []);
  // The same countries still match through a demonym or capital.
  assert.equal(assignCommands("Georgian troops train near Tbilisi").primary, "EUCOM");
  assert.equal(assignCommands("Jordanian officials met in Amman").primary, "CENTCOM");
});
