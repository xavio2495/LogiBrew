/**
 * Mock for @forge/resolver module
 * Provides test double for Forge Resolver class
 */

export default class Resolver {
  constructor() {
    this.definitions = {};
  }
  
  define(name, handler) {
    this.definitions[name] = handler;
  }
  
  getDefinitions() {
    return this.definitions;
  }
}
