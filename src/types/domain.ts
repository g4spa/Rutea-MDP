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
  "REJECTED",
  "NO_MONEY",
  "RESCHEDULED"
] as const;

export const PAYMENT_METHODS = [
  "CASH",
  "MERCADO_PAGO",
  "BANK_TRANSFER",
  "CURRENT_ACCOUNT"
] as const;

export type Weekday = (typeof WEEKDAYS)[number];
export type DeliveryStatus = (typeof DELIVERY_STATUSES)[number];
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];
