export interface IStorageAdapter {
  getItem<T>(key: string): Promise<T | null>;
  setItem<T>(key: string, value: T): Promise<void>;
  removeItem(key: string): Promise<void>;
  clear(): Promise<void>;
}

// TODO Future Backend: Create SupabaseAdapter implementing IStorageAdapter
// TODO Future Backend: Create BackendApiAdapter implementing IStorageAdapter
