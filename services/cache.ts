interface CacheEntry<T> {
    value: T;
    expiry: number;
}

export class APICache {
    private cache: Map<string, CacheEntry<any>>;
    private maxSize: number;
    private ttl: number;
    private dbName: string;
    private dbVersion: number;
    private db: IDBDatabase | null = null;
    private initDBPromise: Promise<IDBDatabase | void> | null = null;

    constructor(options: { maxSize: number; ttl: number; dbName?: string; dbVersion?: number }) {
        this.cache = new Map();
        this.maxSize = options.maxSize;
        this.ttl = options.ttl;
        this.dbName = options.dbName || 'polychrome-cache';
        this.dbVersion = options.dbVersion || 1;

        this.initDB();
    }

    private initDB(): Promise<IDBDatabase | void> {
        if (!('indexedDB' in window)) {
            console.warn('IndexedDB is not supported in this browser.');
            return Promise.resolve();
        }

        if (this.initDBPromise) return this.initDBPromise;

        this.initDBPromise = new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onerror = () => {
                console.error('IndexedDB error:', request.error);
                reject(request.error);
            };
            request.onsuccess = () => {
                this.db = request.result;
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;
                if (!db.objectStoreNames.contains('responses')) {
                    const store = db.createObjectStore('responses', { keyPath: 'key' });
                    store.createIndex('expiry', 'expiry', { unique: false });
                }
            };
        });
        return this.initDBPromise;
    }

    private async getFromIndexedDB<T>(compositeKey: string): Promise<CacheEntry<T> | null> {
        if (!this.db) {
            await this.initDB();
            if (!this.db) return null; // If IndexedDB still not ready, return
        }

        return new Promise((resolve) => {
            const transaction = this.db!.transaction(['responses'], 'readonly');
            const store = transaction.objectStore('responses');
            const request = store.get(compositeKey);

            request.onsuccess = () => resolve(request.result || null);
            request.onerror = () => {
                console.debug('IndexedDB read error:', request.error);
                resolve(null);
            };
        });
    }

    private async setInIndexedDB(compositeKey: string, entry: CacheEntry<any>): Promise<void> {
        if (!this.db) {
            await this.initDB();
            if (!this.db) return;
        }

        return new Promise((resolve) => {
            const transaction = this.db!.transaction(['responses'], 'readwrite');
            const store = transaction.objectStore('responses');
            const request = store.put({ key: compositeKey, ...entry });

            request.onsuccess = () => resolve();
            request.onerror = () => {
                console.debug('IndexedDB write error:', request.error);
                resolve(); // Resolve even on error to not block main thread
            };
        });
    }

    async get<T>(type: string, key: string | number): Promise<T | null> {
        const compositeKey = `${type}:${key}`;
        let entry = this.cache.get(compositeKey);

        // Check in-memory cache first
        if (entry) {
            if (Date.now() < entry.expiry) {
                return entry.value;
            } else {
                this.cache.delete(compositeKey); // Expired in-memory
            }
        }

        // If not in-memory or expired, check IndexedDB
        entry = await this.getFromIndexedDB<T>(compositeKey);
        if (entry) {
            if (Date.now() < entry.expiry) {
                this.cache.set(compositeKey, entry); // Add to in-memory cache from IndexedDB
                return entry.value;
            } else {
                // Expired in IndexedDB, remove it
                await this.deleteFromIndexedDB(compositeKey);
            }
        }

        return null;
    }

    async set(type: string, key: string | number, value: any): Promise<void> {
        const compositeKey = `${type}:${key}`;
        const entry: CacheEntry<any> = {
            value,
            expiry: Date.now() + this.ttl
        };

        // Add to in-memory cache
        if (this.cache.size >= this.maxSize) {
            // Simple eviction: remove oldest entry
            const oldestKey = this.cache.keys().next().value;
            if (oldestKey) this.cache.delete(oldestKey);
        }
        this.cache.set(compositeKey, entry);

        // Add to IndexedDB
        await this.setInIndexedDB(compositeKey, entry);
    }

    async deleteFromIndexedDB(compositeKey: string): Promise<void> {
        if (!this.db) {
            await this.initDB();
            if (!this.db) return;
        }
        return new Promise((resolve) => {
            const transaction = this.db!.transaction(['responses'], 'readwrite');
            const store = transaction.objectStore('responses');
            const request = store.delete(compositeKey);
            request.onsuccess = () => resolve();
            request.onerror = () => {
                console.debug('IndexedDB delete error:', request.error);
                resolve();
            };
        });
    }

    async clearExpired(): Promise<void> {
        const now = Date.now();
        
        // Clear expired from in-memory cache
        for (const [key, entry] of this.cache.entries()) {
            if (now > entry.expiry) {
                this.cache.delete(key);
            }
        }

        // Clear expired from IndexedDB
        if (!this.db) {
            await this.initDB();
            if (!this.db) return;
        }

        return new Promise((resolve) => {
            const transaction = this.db!.transaction(['responses'], 'readwrite');
            const store = transaction.objectStore('responses');
            const index = store.index('expiry');
            const range = IDBKeyRange.upperBound(now); // All entries with expiry < now

            const request = index.openCursor(range);
            request.onsuccess = (event) => {
                const cursor = (event.target as IDBRequest).result;
                if (cursor) {
                    cursor.delete();
                    cursor.continue();
                } else {
                    resolve();
                }
            };
            request.onerror = () => {
                console.debug('IndexedDB clearExpired error:', request.error);
                resolve();
            };
        });
    }

    async clear(): Promise<void> {
        this.cache.clear();

        if (!this.db) {
            await this.initDB();
            if (!this.db) return;
        }

        return new Promise((resolve) => {
            const transaction = this.db!.transaction(['responses'], 'readwrite');
            const store = transaction.objectStore('responses');
            const request = store.clear();

            request.onsuccess = () => resolve();
            request.onerror = () => {
                console.error('IndexedDB clear error:', request.error);
                resolve();
            };
        });
    }

    getCacheStats() {
        return { 
            inMemorySize: this.cache.size,
            maxSize: this.maxSize,
            ttl: this.ttl,
            indexedDBStatus: this.db ? 'connected' : 'disconnected'
        };
    }
}