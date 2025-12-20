/**
 * Mock for @forge/api module
 * Provides test doubles for Forge storage and fetch APIs
 */

export const storage = {
  get: async () => null,
  set: async () => undefined,
  delete: async () => undefined,
  query: () => ({
    where: () => storage.query(),
    getMany: async () => ({ results: [] })
  })
};

export const fetch = async () => ({});
