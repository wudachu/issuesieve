import { describe, expect, it } from "vitest";

import { parseArguments } from "../src/cli.js";

describe("parseArguments", () => {
  it("enables mock mode for demo", () => {
    expect(parseArguments(["demo"])).toMatchObject({ command: "demo", mock: true });
  });

  it("parses file and output format", () => {
    expect(parseArguments(["triage", "--file", "issue.json", "--format", "json"])).toEqual({
      command: "triage",
      file: "issue.json",
      url: undefined,
      format: "json",
      mock: false,
    });
  });

  it("rejects an invalid format", () => {
    expect(() => parseArguments(["demo", "--format", "xml"])).toThrow(
      "--format must be markdown or json",
    );
  });
});
