import Component from '@glimmer/component';
import { action } from '@ember/object';

export default class NavItemComponent extends Component {
  element = null;

  willDestroy() {
    this.args.unregisterItem(this);
    super.willDestroy(...arguments);
  }

  get isActive() {
    return this.args.navItem.elementId === this.args.activePane.elementId;
  }

  @action
  setupElement(element) {
    this.element = element;
  }

  @action
  clickItem(e) {
    e.preventDefault();

    if (this.args.onClick) {
      this.args.onClick(this.args.navItem.index);
    }
  }
}
