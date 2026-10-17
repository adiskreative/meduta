import { describe, expect, it } from "vitest";
import { parseDokuNotification } from "@/lib/doku-notification";

describe("parseDokuNotification", () => {
  it("reads the nested Checkout notification structure", () => {
    expect(
      parseDokuNotification({
        order: { invoice_number: "MEDUTA-123" },
        transaction: { status: "SUCCESS", amount: 50000 },
      }),
    ).toEqual({
      invoiceNumber: "MEDUTA-123",
      transactionStatus: "SUCCESS",
      amount: 50000,
    });
  });

  it("supports dotted field names for existing notification payloads", () => {
    expect(
      parseDokuNotification({
        "order.invoice_number": "MEDUTA-456",
        "transaction.status": "SUCCESS",
        "transaction.amount": "50000",
      }),
    ).toEqual({
      invoiceNumber: "MEDUTA-456",
      transactionStatus: "SUCCESS",
      amount: 50000,
    });
  });

  it("rejects non-object payloads and ignores malformed amounts", () => {
    expect(parseDokuNotification(null)).toBeNull();
    expect(
      parseDokuNotification({
        order: { invoice_number: "MEDUTA-789" },
        transaction: { status: "PENDING", amount: "invalid" },
      }),
    ).toEqual({
      invoiceNumber: "MEDUTA-789",
      transactionStatus: "PENDING",
    });
  });
});
