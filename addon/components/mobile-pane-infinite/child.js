import Component from '@glimmer/component';
import { htmlSafe } from '@ember/template';
import { action } from '@ember/object';

export default class ChildComponent extends Component {
  // private
  transformableElement = null;

  @action
  setScrollOffset() {
    if (this.args.setAsDocumentScroll) {
      const current = document.scrollingElement || document.documentElement;
      current.scrollTop = this.args.scroll;
    } else {
      this.transformableElement.style.transform = `translateY(-${this.args.scroll}px)`;
    }
  }

  get style() {
    return this.args.offsetTop
      ? htmlSafe(`transform: translateY(${this.args.offsetTop}px);`)
      : null;
  }
}
