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
      const current = document.scrollingElement || document.documentElement;
      current.scrollTop = scroll;
    } else {
      element.style.transform = `translateY(-${scroll}px)`;
    }
  });

  get style() {
    return this.args.offsetTop
      ? htmlSafe(`transform: translateY(${this.args.offsetTop}px);`)
      : null;
  }
}
