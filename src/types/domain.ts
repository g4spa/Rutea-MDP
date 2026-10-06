export const WEEKDAYS = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY"
] as const;

export const DELIVERY_STATUSES = [
  "PENDING",
  "DELIVERED",
  "CLOSED",
  "REJECTED_PARTIAL",
  "REJECTED_TOTAL",
  "NO_MONEY",
  "RESCHEDULED"
] as const;

export const PAYMENT_METHODS = [
  "CASH",
  "MERCADO_PAGO",
  "BANK_TRANSFER",
  "CURRENT_ACCOUNT"
] as const;

export const EXPENSE_TYPES = ["TOLL", "EXTRA_FUEL", "MEAL", "OTHER"] as const;
export const ROUTE_STATUSES = ["DRAFT", "READY", "IN_PROGRESS", "COMPLETED", "ARCHIVED"] as const;
export const ROAD_SURFACES = ["ASPHALT", "GRAVEL", "DIRT"] as const;
export const TAX_CONDITIONS = ["RESPONSABLE_INSCRIPTO", "MONOTRIBUTO", "EXENTO", "CONSUMIDOR_FINAL"] as const;
export const INVOICE_PREFERENCES = ["A", "B"] as const;

export type Weekday = (typeof WEEKDAYS)[number];
export type DeliveryStatus = (typeof DELIVERY_STATUSES)[number];
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];
export type ExpenseType = (typeof EXPENSE_TYPES)[number];
