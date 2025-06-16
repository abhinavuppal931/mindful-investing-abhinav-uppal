
interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number;
}

const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

class OpenAICache {
  private cache = new Map<string, CacheEntry>();

  set(key: string, data: any, ttl: number = CACHE_TTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
    
    // Also store in localStorage for persistence across sessions
    try {
      const cacheData = {
        data,
        timestamp: Date.now(),
        ttl
      };
      localStorage.setItem(`openai_cache_${key}`, JSON.stringify(cacheData));
    } catch (error) {
      console.warn('Failed to store in localStorage:', error);
    }
  }

  get(key: string): any | null {
    // Check memory cache first
    const memoryEntry = this.cache.get(key);
    if (memoryEntry && this.isValid(memoryEntry)) {
      return memoryEntry.data;
    }

    // Check localStorage cache
    try {
      const stored = localStorage.getItem(`openai_cache_${key}`);
      if (stored) {
        const entry: CacheEntry = JSON.parse(stored);
        if (this.isValid(entry)) {
          // Restore to memory cache
          this.cache.set(key, entry);
          return entry.data;
        } else {
          // Remove expired cache
          localStorage.removeItem(`openai_cache_${key}`);
        }
      }
    } catch (error) {
      console.warn('Failed to read from localStorage:', error);
    }

    return null;
  }

  private isValid(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp < entry.ttl;
  }

  clear(key?: string): void {
    if (key) {
      this.cache.delete(key);
      try {
        localStorage.removeItem(`openai_cache_${key}`);
      } catch (error) {
        console.warn('Failed to remove from localStorage:', error);
      }
    } else {
      this.cache.clear();
      try {
        Object.keys(localStorage).forEach(storageKey => {
          if (storageKey.startsWith('openai_cache_')) {
            localStorage.removeItem(storageKey);
          }
        });
      } catch (error) {
        console.warn('Failed to clear localStorage:', error);
      }
    }
  }
}

export const openaiCache = new OpenAICache();
