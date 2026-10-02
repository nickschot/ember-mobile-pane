const memories = new WeakMap();

/**
 * Returns the scroll position store for the given owner. Scoping the store to
 * the owner (the application instance) keeps separate apps and test runs
 * isolated from each other.
 *
 * @private
 * @param {object} owner
 * @returns {Map<string, number>}
 */
export function scrollMemoryFor(owner) {
  let memory = memories.get(owner);

  if (!memory) {
    memory = new Map();
    memories.set(owner, memory);
  }

  return memory;
}
