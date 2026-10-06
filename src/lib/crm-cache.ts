"use client";

export interface CrmEmployeeOption {
  id: string;
  firstName: string;
  lastName: string;
  designation?: string | null;
}

export interface CrmClientOption {
  id: string;
  name: string;
  code: string;
  tier?: string;
  status?: string;
}

interface CacheItem<T> {
  data: T;
  cachedAt: number;
}

const CACHE_TTL_MS = 60 * 1000; // 60 seconds fresh cache on client

let employeesCache: CacheItem<CrmEmployeeOption[]> | null = null;
let inFlightEmployeesPromise: Promise<CrmEmployeeOption[]> | null = null;

let clientsCache: CacheItem<CrmClientOption[]> | null = null;
let inFlightClientsPromise: Promise<CrmClientOption[]> | null = null;

/**
 * Retrieves CRM employee options with in-memory client caching and concurrent request deduplication.
 */
export async function fetchCrmEmployees(): Promise<CrmEmployeeOption[]> {
  const now = Date.now();
  if (employeesCache && now - employeesCache.cachedAt < CACHE_TTL_MS) {
    return employeesCache.data;
  }

  if (inFlightEmployeesPromise) {
    return inFlightEmployeesPromise;
  }

  inFlightEmployeesPromise = (async () => {
    try {
      const res = await fetch("/api/employees?limit=100&lite=true");
      if (!res.ok) return [];
      const json = await res.json();
      const list: CrmEmployeeOption[] = json.data?.employees || [];
      employeesCache = { data: list, cachedAt: Date.now() };
      return list;
    } catch (err) {
      console.error("[CrmCache] Failed to fetch employees:", err);
      return [];
    } finally {
      inFlightEmployeesPromise = null;
    }
  })();

  return inFlightEmployeesPromise;
}

/**
 * Retrieves CRM client options with in-memory client caching and concurrent request deduplication.
 */
export async function fetchCrmClients(): Promise<CrmClientOption[]> {
  const now = Date.now();
  if (clientsCache && now - clientsCache.cachedAt < CACHE_TTL_MS) {
    return clientsCache.data;
  }

  if (inFlightClientsPromise) {
    return inFlightClientsPromise;
  }

  inFlightClientsPromise = (async () => {
    try {
      const res = await fetch("/api/crm/clients?limit=100&lite=true");
      if (!res.ok) return [];
      const json = await res.json();
      const list: CrmClientOption[] = json.data?.clients || [];
      clientsCache = { data: list, cachedAt: Date.now() };
      return list;
    } catch (err) {
      console.error("[CrmCache] Failed to fetch clients:", err);
      return [];
    } finally {
      inFlightClientsPromise = null;
    }
  })();

  return inFlightClientsPromise;
}

/**
 * Invalidates the client-side dropdown caches (e.g. after adding a new client or employee).
 */
export function invalidateClientCrmCache(type?: "employees" | "clients") {
  if (!type || type === "employees") {
    employeesCache = null;
    inFlightEmployeesPromise = null;
  }
  if (!type || type === "clients") {
    clientsCache = null;
    inFlightClientsPromise = null;
  }
}
