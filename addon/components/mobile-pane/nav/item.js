import Component from '@glimmer/component';
import { action } from '@ember/object';
import { modifier } from 'ember-modifier';

export default class NavItemComponent extends Component {
  element = null;

  register = modifier((element) => {
    const { registerItem, unregisterItem } = this.args;
    this.element = element;
    registerItem(this);

    return () => unregisterItem(this);
  });

  get isActive() {
    return this.args.navItem.elementId === this.args.activePane.elementId;
  }

  @action
  clickItem(e) {
    e.preventDefault();

    if (this.args.onClick) {
      this.args.onClick(this.args.navItem.index);
    }
  }
}
