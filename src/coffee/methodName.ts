export const METHOD_NAME_MAX = 40

export type MethodNameCheck = { ok: true; name: string } | { ok: false; message: string }

// Cleans a typed method name, or says in one sentence what's wrong with it.
// ownName: the method's current name when renaming, so it doesn't clash with itself.
export function checkMethodName(typed: string, existingNames: string[], ownName?: string): MethodNameCheck {
  const name = typed.trim()
  if (!name) return { ok: false, message: 'Type a name first.' }
  if ([...name].length > METHOD_NAME_MAX) {
    return { ok: false, message: `Keep it to ${METHOD_NAME_MAX} characters.` }
  }
  const clash = existingNames.find(
    (existing) => existing !== ownName && existing.toLowerCase() === name.toLowerCase(),
  )
  if (clash) return { ok: false, message: `You already have ${clash}.` }
  return { ok: true, name }
}
