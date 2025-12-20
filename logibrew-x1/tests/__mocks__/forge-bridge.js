/**
 * Mock for @forge/bridge module
 * Provides test doubles for Forge bridge APIs (invoke, view, request)
 */

export const invoke = async () => ({});

export const view = {
  getContext: async () => ({})
};

export const requestJira = async () => ({
  ok: true,
  json: async () => ({}),
  text: async () => ''
});

export const requestConfluence = async () => ({
  ok: true,
  json: async () => ({}),
  text: async () => ''
});
