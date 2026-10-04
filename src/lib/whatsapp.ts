export function whatsappUrl(phone: string | null | undefined, message: string) {
  const normalizedPhone = (phone || "").replace(/\D/g, "");
  const query = encodeURIComponent(message);
  return `https://wa.me/${normalizedPhone}?text=${query}`;
}

export function approachingMessage(minutes: number) {
  return `¡Hola! Salgo para tu local desde el depósito, llego en aprox. ${minutes} minutos.`;
}

export function closedMessage() {
  return "Hola, pasé por tu domicilio y el local estaba cerrado. Nos comunicamos para reprogramar.";
}
