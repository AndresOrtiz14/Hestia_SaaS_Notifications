const WORD_MAP: Record<string, number> = {
  uno: 1, one: 1,
  dos: 2, two: 2,
  tres: 3, three: 3,
  cuatro: 4, four: 4,
  cinco: 5, five: 5,
};

/**
 * Extrae un rating 1-5 a partir del texto libre del usuario.
 * Soporta: dígitos directos, palabras en español/inglés, emojis de estrella.
 * Devuelve null si no puede determinar un número válido.
 */
export function extractRating(text: string): number | null {
  const normalized = text.trim().toLowerCase();

  // 1. Dígito directo "4", "5", etc.
  const directMatch = normalized.match(/^[1-5]$/);
  if (directMatch) return parseInt(directMatch[0], 10);

  // 2. Palabras en español/inglés
  if (WORD_MAP[normalized] !== undefined) return WORD_MAP[normalized];

  // 3. Conteo de emojis de estrella ⭐
  const stars = (text.match(/⭐/g) ?? []).length;
  if (stars >= 1 && stars <= 5) return stars;

  // 4. Número entre 1-5 en contexto textual
  const contextMatch = normalized.match(/\b([1-5])\b/);
  if (contextMatch) return parseInt(contextMatch[1], 10);

  return null;
}
