import Component from '@glimmer/component';
import { action } from '@ember/object';
import { htmlSafe } from '@ember/string';

export default class SimpleIndicatorComponent extends Component {
  /**
   * When enabled a warp effect will be used for the indicator.
   *
   * @argument warpEnabled
   * @type boolean
   * @default false
   */

  get style() {
    const offset = -1 * this.args.currentOffset * this.args.navItems.length;
    let style = `transform: translateX(${offset}%)`;

    if (this.args.warpEnabled) {
      // warp effect
      const fraction = offset % 100 / 100;
      const scale = (2 * fraction - 2 * Math.pow(fraction, 2));
      const scaleY = 1 - scale / 1.5;
      const scaleX = 1 + 1.5 * scale;
      style += ` scale(${scaleX}, ${scaleY})`;
    }
    style += ';';

    return htmlSafe(style);
  }

  @action
  onClick({ index }){
    if (this.args.onClick) {
      this.args.onClick(index);
    }
  }
}
