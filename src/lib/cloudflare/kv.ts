import type { JsonValue } from '@/lib/cloudflare/types'

/**
 * Reads and deserializes a JSON record from KV.
 *
 * @param kv KV namespace instance.
 * @param key Full KV key.
 * @returns Parsed object or `null` when key is absent.
 */
export async function getJson<T>(kv: KVNamespace, key: string): Promise<T | null> {
  const raw = await kv.get(key)
  if (raw === null) {
    return null
  }

  return JSON.parse(raw) as T
}

/**
 * Serializes and writes a JSON-compatible value to KV.
 */
export async function putJson(kv: KVNamespace, key: string, value: JsonValue | object): Promise<void> {
  await kv.put(key, JSON.stringify(value))
}

/**
 * Deletes a key from KV.
 */
export async function deleteKey(kv: KVNamespace, key: string): Promise<void> {
  await kv.delete(key)
}

/**
 * Lists all KV keys for a prefix by traversing pagination cursors.
 */
export async function listKeysWithPrefix(kv: KVNamespace, prefix: string): Promise<string[]> {
  const keys: string[] = []
  let cursor: string | undefined

  do {
    const page = await kv.list({ prefix, cursor })
    keys.push(...page.keys.map(item => item.name))
    cursor = page.list_complete ? undefined : page.cursor
  } while (cursor !== undefined)

  return keys
}
