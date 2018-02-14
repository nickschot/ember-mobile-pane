import Component from '@ember/component';
import layout from '../../templates/components/mobile-pane/simple-indicator';

import { htmlSafe } from '@ember/string';
import { get, computed } from '@ember/object';

export default Component.extend({
  layout,

  classNames: ['scroller__simple-indicator'],

  // protected
  navItems: null,
  currentOffset: 0,

  onClick(){},

  indicatorStyle: computed('currentOffset', function(){
    return htmlSafe(`transform: translateX(${-1 * get(this, 'currentOffset') * get(this, 'navItems.length')}%);`);
  }),

  actions: {
    onClick(navItem){
      get(this, 'onClick')(navItem);
    }
  }
});
