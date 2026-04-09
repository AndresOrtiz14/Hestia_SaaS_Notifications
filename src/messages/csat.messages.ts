// ── Mensajes CSAT — Ticket ───────────────────────────────────────────────────────

export function ticketQ1(ticketIdCode: number | string): string {
  return (
    `Nos gustaría conocer tu opinión sobre la atención recibida en tu ticket #${ticketIdCode}.\n\n` +
    `¿Cómo calificarías tu experiencia?\n\n` +
    `Responde con un número del 1 al 5:\n` +
    `1️⃣ - Muy mala\n` +
    `2️⃣ - Mala\n` +
    `3️⃣ - Regular\n` +
    `4️⃣ - Buena\n` +
    `5️⃣ - Excelente`
  );
}

export function ticketQ2Improvement(): string {
  return '¿Qué podríamos haber hecho mejor? Tu opinión nos ayuda a mejorar. 🙏';
}

export function ticketQ2Praise(): string {
  return '¡Qué bueno saberlo! 😊 ¿Qué fue lo que más te gustó de la atención?';
}

export function ticketQ3(): string {
  return (
    `Por último, ¿qué tan útil te resultó poder gestionar tu solicitud por WhatsApp?\n\n` +
    `1️⃣ - Nada útil\n` +
    `2️⃣ - Poco útil\n` +
    `3️⃣ - Regular\n` +
    `4️⃣ - Útil\n` +
    `5️⃣ - Muy útil`
  );
}

// ── Mensajes CSAT — FAQ ──────────────────────────────────────────────────────────

export function faqQ1(): string {
  return (
    `¿Te fue útil la información que te proporcionamos?\n\n` +
    `Por favor califica del 1 al 5:\n` +
    `1️⃣ - Nada útil\n` +
    `2️⃣ - Poco útil\n` +
    `3️⃣ - Regular\n` +
    `4️⃣ - Útil\n` +
    `5️⃣ - Muy útil`
  );
}

export function faqQ2(): string {
  return '¿Qué podríamos haber explicado mejor? Tu feedback es muy valioso. 🙏';
}

// ── Mensajes CSAT — Conversación ─────────────────────────────────────────────────

export function conversationCsatQ1(): string {
  return (
    `Esperamos que tu estadía esté siendo excelente. 😊\n\n` +
    `¿Cómo calificarías la atención recibida durante tu conversación con nosotros?\n\n` +
    `Responde con un número del 1 al 5:\n` +
    `1️⃣ - Muy mala\n` +
    `2️⃣ - Mala\n` +
    `3️⃣ - Regular\n` +
    `4️⃣ - Buena\n` +
    `5️⃣ - Excelente`
  );
}

// ── Mensajes comunes ─────────────────────────────────────────────────────────────

export function thankYouMessage(): string {
  return '¡Gracias por tu tiempo! Nos ayuda mucho a mejorar. 🙏\n\nSi necesitas algo más, escríbenos cuando quieras.';
}

export function invalidRatingMessage(): string {
  return (
    'No entendí tu calificación. Por favor responde con un número del 1 al 5:\n' +
    '1️⃣ Muy malo/nada útil · 2️⃣ Malo/poco útil · 3️⃣ Regular · 4️⃣ Bueno/útil · 5️⃣ Excelente/muy útil'
  );
}

export function shortCommentMessage(): string {
  return 'Por favor comparte tu opinión con un poco más de detalle (mínimo 3 caracteres).';
}
