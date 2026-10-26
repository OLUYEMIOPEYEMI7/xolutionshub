import { describe, expect, it } from "vitest";
import { SERVICES } from "../data/catalog";
import { quote, violations } from "./pricing";
import { emptyDetails, validate } from "./validation";

describe("catalog", () => {
  it("matches the verified price list", () => {
    const p = Object.fromEntries(SERVICES.map((s) => [s.id, s.price]));
    expect(p).toMatchObject({ topic: 25000, "ch1-3": 50000, "ch4-5": 40000, questionnaire: 10000, analysis: 40000, cleaning: 15000, referencing: 10000, formatting: 15000, proofreading: 15000, powerpoint: 15000, defense: 20000, full: 150000 });
    expect(SERVICES).toHaveLength(12);
  });
});

describe("quote", () => {
  it("sums services and adds delivery surcharge", () => {
    const q = quote(new Set(["topic", "ch1-3"]), "urgent");
    expect(q.subtotal).toBe(75000);
    expect(q.total).toBe(100000);
  });
  it("charges nothing for an empty order", () => {
    expect(quote(new Set(), "urgent").total).toBe(0);
  });
  it("priority adds 15,000", () => {
    expect(quote(new Set(["questionnaire"]), "priority").total).toBe(25000);
  });
});

describe("rules", () => {
  it("flags conflicts and missing requirements", () => {
    const rules = [
      { kind: "requires" as const, service: "analysis", with: "cleaning", message: "r" },
      { kind: "conflicts" as const, service: "full", with: "topic", message: "c" },
    ];
    expect(violations(new Set(["analysis"]), rules)).toEqual(["r"]);
    expect(violations(new Set(["full", "topic"]), rules)).toEqual(["c"]);
    expect(violations(new Set(["analysis", "cleaning"]), rules)).toEqual([]);
  });
});

describe("validate", () => {
  it("rejects empty details", () => {
    expect(Object.keys(validate(emptyDetails))).toEqual(expect.arrayContaining(["fullName", "email", "phone", "institution", "department", "consent"]));
  });
  it("accepts valid details", () => {
    const ok = { ...emptyDetails, fullName: "Ada Obi", email: "ada@example.com", phone: "0801 234 5678", institution: "UNILORIN", department: "Economics", consent: true };
    expect(validate(ok)).toEqual({});
  });
});
