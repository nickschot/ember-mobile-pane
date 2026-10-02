import Component from '@glimmer/component';
import { action } from '@ember/object';
import { htmlSafe } from '@ember/template';
import { fn } from '@ember/helper';
import { on } from '@ember/modifier';
import './simple-indicator.css';

export default class SimpleIndicatorComponent extends Component {
  /**
   * When enabled a warp effect will be used for the indicator.
   *
   * @argument warpEnabled
   * @type boolean
   * @default false
   */

  get style() {
    const offset = 100 * this.args.offset;

    let style = `transform: translateX(${offset}%)`;
    if (this.args.warpEnabled) {
      // warp effect
      const fraction = (offset % 100) / 100;
      const scale = 2 * fraction - 2 * Math.pow(fraction, 2);
      const scaleY = 1 - scale / 1.5;
      const scaleX = 1 + 1.5 * scale;
      style += ` scale(${scaleX}, ${scaleY})`;
    }
    style += ';';

    return htmlSafe(style);
  }

  @action
  onClick({ index }) {
    if (this.args.onClick) {
      this.args.onClick(index);
    }
  }

  <template>
    <div ...attributes class="scroller__simple-indicator">
      {{#each @navItems as |navItem|}}
        <button {{on "click" (fn this.onClick navItem)}} type="button"><i
          ></i></button>
      {{/each}}

      <span class="simple-indicator__indicator" style={{this.style}}><i
        ></i></span>
    </div>
  </template>
}
