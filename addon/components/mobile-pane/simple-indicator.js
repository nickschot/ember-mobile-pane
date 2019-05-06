import Component from '@ember/component';
import layout from '../../templates/components/mobile-pane/simple-indicator';

import { htmlSafe } from '@ember/string';
import { get, computed } from '@ember/object';

/**
 * @class MobilePaneSimpleIndicatorComponent
 */
export default Component.extend({
  layout,

  classNames: ['scroller__simple-indicator'],

  // public

  /**
   * Optional warp effect for indicator
   *
   * @argument warpEnabled
   * @type {boolean}
   * @default false
   */
  warpEnabled: false,

  /**
   * @argument onClick
   * @type {function}
   */
  onClick(){},

  // protected
  navItems: null,
  currentOffset: 0,

  indicatorStyle: computed('currentOffset', function(){
    const offset = -1 * get(this, 'currentOffset') * get(this, 'navItems.length');
    let style = `transform: translateX(${offset}%)`;

    if(get(this, 'warpEnabled')){
      // warp effect
      const fraction = offset % 100 / 100;
      const scale = (2 * fraction - 2 * Math.pow(fraction, 2));
      const scaleY = 1 - scale / 1.5;
      const scaleX = 1 + 1.5 * scale;
      style += ` scale(${scaleX}, ${scaleY})`;
    }
    style += ';';

    return htmlSafe(style);
  }),

  actions: {
    onClick(navItem){
      get(this, 'onClick')(navItem);
    }
  }
});
