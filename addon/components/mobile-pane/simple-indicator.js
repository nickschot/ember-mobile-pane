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
    //TODO: make this calculation more robust
    return htmlSafe(`transform: translateX(${-4 * get(this, 'currentOffset')}%);`);
  }),

  actions: {
    onClick(navItem){
      get(this, 'onClick')(navItem);
    }
  }
});
