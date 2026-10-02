import Component from '@glimmer/component';
import { htmlSafe } from '@ember/template';
import { modifier } from 'ember-modifier';

export default class ChildComponent extends Component {
  // private
  transformableElement = null;

  #didApplyScroll = false;

  /**
   * Applies the restored scroll offset once, when the element is inserted
   * (like the previous `did-insert`). Later `@scroll` changes are ignored so
   * the page doesn't jump while the user is scrolling.
   */
  applyScroll = modifier((element) => {
    if (this.#didApplyScroll) {
      return;
    }
    this.#didApplyScroll = true;
    this.transformableElement = element;

    const { scroll, setAsDocumentScroll } = this.args;

    if (setAsDocumentScroll) {
      // `scroll` is relative to the top of the scroller, which isn't
      // necessarily the top of the page
      const scroller =
        element.closest('.mobile-pane__infinite-scroller') ?? element;
      const top = scroller.getBoundingClientRect().top;

      if (Math.max(0, -top) !== scroll) {
        const doc = document.scrollingElement || document.documentElement;
        doc.scrollTop += top + scroll;
      }
    } else {
      element.style.transform = `translateY(-${scroll}px)`;
    }
  });

  get style() {
    return this.args.offsetTop
      ? htmlSafe(`transform: translateY(${this.args.offsetTop}px);`)
      : null;
  }

  <template>
    <div ...attributes class="mobile-pane__child" style={{this.style}}>
      <div class="mobile-pane__child-transformable" {{this.applyScroll}}>
        {{yield}}
      </div>
    </div>
  </template>
}
