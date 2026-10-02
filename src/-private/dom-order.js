/**
 * Returns a copy of `items` with `item` added, ordered like their `element`s
 * in the DOM. Items are registered when they're inserted, so a pane or nav
 * item rendered between existing ones (e.g. by an `{{#if}}`) would otherwise
 * end up last.
 *
 * @private
 * @template {{ element: Element }} T
 * @param {T[]} items
 * @param {T} item
 * @returns {T[]}
 */
export function insertInDomOrder(items, item) {
  return [...items, item].sort((a, b) =>
    a.element.compareDocumentPosition(b.element) &
    Node.DOCUMENT_POSITION_FOLLOWING
      ? -1
      : 1,
  );
}
