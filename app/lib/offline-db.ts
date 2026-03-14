// app/lib/offline-db.ts
// IndexedDB wrapper for storing tickets offline

interface StoredTicket {
    id: string;
    bookingReference: string;
    ticketNumber: string;
    passengerName: string;
    seatNumber: string;
    route: string;
    departureTime: string;
    date: string;
    price: number;
    qrCode: string;
    status: 'valid' | 'used' | 'expired';
    syncedAt?: number;
}

const DB_NAME = 'VayaZedBooking';
const DB_VERSION = 1;
const TICKETS_STORE = 'tickets';
const SYNC_QUEUE_STORE = 'syncQueue';

export class OfflineDB {
    private db: IDBDatabase | null = null;

    async init(): Promise<void> {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve();
            };

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;

                // Create tickets store
                if (!db.objectStoreNames.contains(TICKETS_STORE)) {
                    const ticketStore = db.createObjectStore(TICKETS_STORE, { keyPath: 'id' });
                    ticketStore.createIndex('bookingReference', 'bookingReference', { unique: false });
                    ticketStore.createIndex('status', 'status', { unique: false });
                    ticketStore.createIndex('syncedAt', 'syncedAt', { unique: false });
                }

                // Create sync queue store for offline actions
                if (!db.objectStoreNames.contains(SYNC_QUEUE_STORE)) {
                    const syncStore = db.createObjectStore(SYNC_QUEUE_STORE, {
                        keyPath: 'id',
                        autoIncrement: true
                    });
                    syncStore.createIndex('action', 'action', { unique: false });
                    syncStore.createIndex('createdAt', 'createdAt', { unique: false });
                }
            };
        });
    }

    // Save ticket for offline access
    async saveTicket(ticket: StoredTicket): Promise<void> {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([TICKETS_STORE], 'readwrite');
            const store = transaction.objectStore(TICKETS_STORE);

            const ticketWithSync = {
                ...ticket,
                syncedAt: Date.now()
            };

            const request = store.put(ticketWithSync);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    // Get all offline tickets
    async getTickets(): Promise<StoredTicket[]> {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([TICKETS_STORE], 'readonly');
            const store = transaction.objectStore(TICKETS_STORE);
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    // Get ticket by ID
    async getTicket(id: string): Promise<StoredTicket | null> {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([TICKETS_STORE], 'readonly');
            const store = transaction.objectStore(TICKETS_STORE);
            const request = store.get(id);

            request.onsuccess = () => resolve(request.result || null);
            request.onerror = () => reject(request.error);
        });
    }

    // Get tickets by status
    async getTicketsByStatus(status: string): Promise<StoredTicket[]> {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([TICKETS_STORE], 'readonly');
            const store = transaction.objectStore(TICKETS_STORE);
            const index = store.index('status');
            const request = index.getAll(status);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    // Delete old tickets (cleanup)
    async cleanupOldTickets(daysOld: number = 30): Promise<void> {
        if (!this.db) await this.init();

        const cutoffTime = Date.now() - (daysOld * 24 * 60 * 60 * 1000);

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([TICKETS_STORE], 'readwrite');
            const store = transaction.objectStore(TICKETS_STORE);
            const index = store.index('syncedAt');
            const range = IDBKeyRange.upperBound(cutoffTime);
            const request = index.openCursor(range);

            request.onsuccess = (event) => {
                const cursor = (event.target as IDBRequest).result;
                if (cursor) {
                    store.delete(cursor.primaryKey);
                    cursor.continue();
                } else {
                    resolve();
                }
            };
            request.onerror = () => reject(request.error);
        });
    }

    // Queue action for background sync
    async queueAction(action: string, data: any): Promise<void> {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([SYNC_QUEUE_STORE], 'readwrite');
            const store = transaction.objectStore(SYNC_QUEUE_STORE);

            const request = store.add({
                action,
                data,
                createdAt: Date.now(),
                status: 'pending'
            });

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    // Get pending sync actions
    async getPendingActions(): Promise<any[]> {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([SYNC_QUEUE_STORE], 'readonly');
            const store = transaction.objectStore(SYNC_QUEUE_STORE);
            const index = store.index('createdAt');
            const request = index.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    // Remove synced action
    async removeAction(id: number): Promise<void> {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([SYNC_QUEUE_STORE], 'readwrite');
            const store = transaction.objectStore(SYNC_QUEUE_STORE);
            const request = store.delete(id);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    // Add to app/lib/offline-db.ts inside the OfflineDB class

    // Delete ticket
    async deleteTicket(id: string): Promise<void> {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([TICKETS_STORE], 'readwrite');
            const store = transaction.objectStore(TICKETS_STORE);
            const request = store.delete(id);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    // Clear all tickets (for cleanup)
    async clearAllTickets(): Promise<void> {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db!.transaction([TICKETS_STORE], 'readwrite');
            const store = transaction.objectStore(TICKETS_STORE);
            const request = store.clear();

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }
}

export const offlineDB = new OfflineDB();