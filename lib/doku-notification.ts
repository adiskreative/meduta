type DokuNotificationRecord = {
  invoiceNumber: string;
  transactionStatus: string;
  amount?: number;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

export function parseDokuNotification(
  payload: unknown,
): DokuNotificationRecord | null {
  const body = asRecord(payload);
  if (!body) return null;

  const order = asRecord(body.order);
  const transaction = asRecord(body.transaction);
  const rawAmount = body["transaction.amount"] ?? transaction?.amount;
  const amount = Number(rawAmount);

  return {
    invoiceNumber: asString(
      body["order.invoice_number"] ?? order?.invoice_number,
    ),
    transactionStatus: asString(
      body["transaction.status"] ?? transaction?.status,
    ),
    ...(rawAmount !== undefined && Number.isFinite(amount) ? { amount } : {}),
  };
}
