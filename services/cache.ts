interface CacheEntry<T> {
    value: T;
    expiry: number;
}

export class APICache {
    private cache: Map<string, CacheEntry<any>>;
    private maxSize: number;
    private ttl: number;

    constructor(options: { maxSize: number; ttl: number }) {
        this.cache = new Map();
        this.maxSize = options.maxSize;
        this.ttl = options.ttl;
    }

    async get<T>(type: string, key: string | number): Promise<T | null> {
        const compositeKey = `${type}:${key}`;
        const entry = this.cache.get(compositeKey);

        if (!entry) return null;

        if (Date.now() > entry.expiry) {
            this.cache.delete(compositeKey);
            return null;
        }

        return entry.value;
    }

    async set(type: string, key: string | number, value: any): Promise<void> {
        const compositeKey = `${type}:${key}`;
        
        if (this.cache.size >= this.maxSize) {
            // Simple eviction: remove first key (oldest insertion usually)
            const firstKey = this.cache.keys().next().value;
            if(firstKey) this.cache.delete(firstKey);
        }

        this.cache.set(compositeKey, {
            value,
            expiry: Date.now() + this.ttl
        });
    }

    clearExpired(): void {
        const now = Date.now();
        for (const [key, entry] of this.cache.entries()) {
            if (now > entry.expiry) {
                this.cache.delete(key);
            }
        }
    }

    async clear(): Promise<void> {
        this.cache.clear();
    }

    getCacheStats() {
        return { size: this.cache.size };
    }
}