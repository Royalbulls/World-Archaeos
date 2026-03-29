/**
 * A simple IndexedDB wrapper for storing large application data.
 */
export class AppDB {
  private dbName: string;
  private version: number;
  private stores: string[];

  constructor(dbName = 'ArchaeosDB', stores = [
    'katha_store', 
    'pulse_store', 
    'profile_store',
    'reconstructor_store',
    'sound_store',
    'drafts_store',
    'artifacts_store',
    'najar_store',
    'business_store',
    'custom_tools_store',
    'vastu_store',
    'websites_store',
    'memories_store',
    'influencers_store',
    'sanskars_store',
    'agents_store',
    'kundli_store'
  ], version = 5) {
    this.dbName = dbName;
    this.stores = stores;
    this.version = version;
  }

  private open(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        this.stores.forEach(storeName => {
          if (!db.objectStoreNames.contains(storeName)) {
            db.createObjectStore(storeName);
          }
        });
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async set(storeName: string, key: string, value: any): Promise<void> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(value, key);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async get<T>(storeName: string, key: string): Promise<T | undefined> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(key);

      request.onsuccess = () => resolve(request.result as T);
      request.onerror = () => reject(request.error);
    });
  }

  async delete(storeName: string, key: string): Promise<void> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(key);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

export const appDB = new AppDB();
