const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function validateName(raw: string): string | null {
  const name = raw.trim();
  return name.length >= 2 && name.length <= 30 ? name : null;
}

export function validateHouse(raw: string): string | null {
  const house = raw.trim();
  if (house.length === 0) return null;
  return house.length <= 20 ? house : null;
}

export function validateMessage(raw: string): string | null {
  const message = raw.trim();
  return message.length >= 1 && message.length <= 500 ? message : null;
}

export function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_RE.test(value);
}
