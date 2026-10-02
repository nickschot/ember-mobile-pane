import { modifier } from 'ember-modifier';

/**
 * Calls `callback` with the `ResizeObserverEntry` whenever the element
 * resizes. Intentionally tiny; can be swapped for `ember-primitives`'
 * `onResize` once ember-source 3.28 support is dropped.
 *
 * @private
 */
export const onResize = modifier((element, [callback]) => {
  const observer = new ResizeObserver((entries) => {
    for (const entry of entries) {
      callback(entry);
    }
  });
  observer.observe(element);

  return () => observer.disconnect();
});
