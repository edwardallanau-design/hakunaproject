import { describe, expect, it } from "vitest";
import { CLASS_COLORS } from "@/lib/wow-constants";

describe("wow-constants", () => {
  it("resolves via the @/ path alias", () => {
    expect(CLASS_COLORS.Priest).toBe("#FFFFFF");
  });
});
