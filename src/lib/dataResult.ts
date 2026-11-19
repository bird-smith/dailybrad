// One shape for every database call: the data, or the error untouched (with its status),
// for the screen to turn into a sentence with dataMessage.
import { supabase } from './supabase'

export type DataError = { status?: number; code?: string; message?: string; name?: string }
export type DataResult<T> = { ok: true; data: T } | { ok: false; error: DataError }

type Reply<T> = { data: T | null; error: { code?: string; message?: string } | null; status: number }

export async function run<T>(query: PromiseLike<Reply<T>>): Promise<DataResult<T>> {
  try {
    const { data, error, status } = await query
    if (error) return { ok: false, error: { ...error, status } }
    return { ok: true, data: data as T }
  } catch (thrown) {
    const { name, message } = (thrown ?? {}) as { name?: string; message?: string }
    return { ok: false, error: { name, message } }
  }
}

/** The shared database connection. AuthGate only shows screens when it exists. */
export function db() {
  if (!supabase) throw new Error('The site is not connected to its database.')
  return supabase
}
