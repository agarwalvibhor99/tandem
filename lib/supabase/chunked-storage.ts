import { z } from 'zod';

export interface StorageDriver {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

const manifestSchema = z.object({
  generation: z.string().regex(/^[a-z0-9-]+$/),
  count: z.number().int().min(1).max(256),
});

/**
 * SecureStore has platform-dependent value limits. Store small encrypted chunks
 * and commit a manifest last, so a failed write never replaces a valid session.
 * The driver stores every value in the OS keychain/keystore, never plaintext files.
 */
export function createChunkedStorage(driver: StorageDriver): StorageDriver {
  let queue: Promise<unknown> = Promise.resolve();
  function serialized<T>(operation: () => Promise<T>): Promise<T> {
    const result = queue.then(operation, operation);
    queue = result.catch(() => undefined);
    return result;
  }
  async function readManifest(key: string) {
    const value = await driver.getItem(key);
    return value ? manifestSchema.parse(JSON.parse(value)) : null;
  }
  function chunkKey(key: string, generation: string, index: number) {
    return `${key}.${generation}.${index}`;
  }
  async function removeChunks(key: string, generation: string, count: number) {
    await Promise.all(Array.from({ length: count }, (_, index) => driver.removeItem(chunkKey(key, generation, index))));
  }

  return {
    getItem: (key) => serialized(async () => {
      const manifest = await readManifest(key);
      if (!manifest) return null;
      const chunks = await Promise.all(Array.from({ length: manifest.count }, (_, index) =>
        driver.getItem(chunkKey(key, manifest.generation, index))));
      if (chunks.some((chunk) => chunk === null)) throw new Error('Session storage is incomplete.');
      return chunks.join('');
    }),
    setItem: (key, value) => serialized(async () => {
      const previous = await readManifest(key);
      // Array.from preserves surrogate pairs. 400 code points fit below 2KB.
      const characters = Array.from(value);
      const count = Math.max(1, Math.ceil(characters.length / 400));
      if (count > 256) throw new Error('Session is too large to store securely.');
      const generation = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
      try {
        for (let index = 0; index < count; index++) {
          await driver.setItem(chunkKey(key, generation, index), characters.slice(index * 400, (index + 1) * 400).join(''));
        }
        await driver.setItem(key, JSON.stringify({ generation, count }));
      } catch (error) {
        await removeChunks(key, generation, count).catch(() => undefined);
        throw error;
      }
      // Old chunks are unreachable after commit. Cleanup must not turn a
      // successful auth-token write into an authentication failure.
      if (previous) await removeChunks(key, previous.generation, previous.count).catch(() => undefined);
    }),
    removeItem: (key) => serialized(async () => {
      const previous = await readManifest(key);
      await driver.removeItem(key);
      if (previous) await removeChunks(key, previous.generation, previous.count);
    }),
  };
}
