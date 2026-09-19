/**
 * Generic cache interface — AI Integration Layer Phase 8.
 *
 * All cache implementations (in-memory LRU, future Redis) satisfy this
 * contract. Callers import `ICache<K,V>` so they can be unit-tested with
 * a simple Map-based stub without touching the real implementation.
 */
export interface ICache<K, V> {
  get(key: K): V | undefined;
  set(key: K, value: V): void;
  delete(key: K): boolean;
  clear(): void;
  /** Current number of entries. */
  size(): number;
}

/**
 * Minimal in-process LRU cache backed by a `Map` (insertion-order
 * iteration makes eviction O(1) without a linked-list).
 *
 * Trade-offs vs. a full LRU library:
 * - Zero external dependencies.
 * - Sufficient for the access patterns of prompt + embedding caches
 *   (entry count bounded, TTL enforced at get-time not via timers).
 * - NOT shared across Node.js workers/processes — intentional for v1.
 *   Swap the concrete implementations below for a Redis client when
 *   multi-instance caching is needed (the interface stays identical).
 */
export class LruCache<K, V> implements ICache<K, V> {
  private readonly map = new Map<K, { value: V; expiresAt: number }>();

  constructor(
    private readonly maxSize: number,
    /** TTL in milliseconds. 0 = no expiry. */
    private readonly ttlMs: number
  ) {}

  get(key: K): V | undefined {
    const entry = this.map.get(key);
    if (!entry) return undefined;

    // TTL check
    if (this.ttlMs > 0 && Date.now() > entry.expiresAt) {
      this.map.delete(key);
      return undefined;
    }

    // LRU refresh: move to end by re-inserting
    this.map.delete(key);
    this.map.set(key, entry);

    return entry.value;
  }

  set(key: K, value: V): void {
    // Evict oldest entry when at capacity
    if (this.map.size >= this.maxSize && !this.map.has(key)) {
      const oldestKey = this.map.keys().next().value;
      if (oldestKey !== undefined) this.map.delete(oldestKey);
    }

    this.map.set(key, {
      value,
      expiresAt: this.ttlMs > 0 ? Date.now() + this.ttlMs : Infinity,
    });
  }

  delete(key: K): boolean {
    return this.map.delete(key);
  }

  clear(): void {
    this.map.clear();
  }

  size(): number {
    return this.map.size;
  }
}
