import Component from '@ember/component';
import layout from '../../templates/components/mobile-pane/nav';

import ComponentParentMixin from 'ember-mobile-pane/mixins/component-parent';
import NavItem from 'ember-mobile-pane/components/mobile-pane/nav/item';
import { computed, get, observer } from '@ember/object';

export default Component.extend(ComponentParentMixin, {
  layout,
  tagName: 'nav',

  classNames: ['mobile-pane__nav'],

  onItemClick(){},

  navOffsetChanged: observer('navOffset', 'childNavItems.@each.elementId', 'elementId', function(){
    const childNavItems = get(this, 'childNavItems');
    const indicator = document.getElementById(`${get(this, 'elementId')}-nav__indicator`);

    if(childNavItems.length){
      const navOffset = get(this, 'navOffset');

      const e1Index = Math.floor(navOffset);
      const e2Index = Math.ceil(navOffset);

      // the first element is always present
      const e1Dims  = get(childNavItems.objectAt(e1Index), 'element').getBoundingClientRect();

      let targetOffsetLeft = e1Dims.left;
      let targetWidth = e1Dims.width;

      if(e1Index !== e2Index){
        const e2Dims = get(childNavItems.objectAt(e2Index), 'element').getBoundingClientRect();
        const relativeOffset = navOffset - e1Index;

        // map relativeOffset to correct ranges
        targetOffsetLeft  = relativeOffset * (e2Dims.left - e1Dims.left) + e1Dims.left;
        targetWidth       = (1 - relativeOffset) * (e1Dims.width - e2Dims.width) + e2Dims.width;
      }

      indicator.style.width = `${targetWidth}px`;
      indicator.style.left = `${targetOffsetLeft}px`;
    }
  }),

  childNavItems: computed.filter('children', function(view) {
    return view instanceof NavItem;
  }),
});
