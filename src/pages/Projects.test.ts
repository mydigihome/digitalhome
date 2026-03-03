import { describe, it, expect } from "vitest";
import { getProjectTypeCategory } from "./Projects";

describe("getProjectTypeCategory", () => {
  it("categorizes event type as 'event'", () => {
    expect(getProjectTypeCategory("event")).toBe("event");
  });

  it("categorizes goal type as 'goal'", () => {
    expect(getProjectTypeCategory("goal")).toBe("goal");
  });

  it("categorizes generic/unknown types as 'goal'", () => {
    expect(getProjectTypeCategory("generic")).toBe("goal");
    expect(getProjectTypeCategory("")).toBe("goal");
    expect(getProjectTypeCategory("project")).toBe("goal");
  });
});
