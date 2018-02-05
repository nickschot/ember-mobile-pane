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

      const elementLeftIndex = Math.floor(navOffset);
      const elementRightIndex = Math.ceil(navOffset);

      // the "left" element is always present
      const elementLeftDimensions  = get(childNavItems.objectAt(elementLeftIndex), 'element').getBoundingClientRect();

      let targetOffsetLeft = 0;
      let targetWidth = 0;

      if(elementLeftIndex !== elementRightIndex){
        const elementRightDimensions = get(childNavItems.objectAt(elementRightIndex), 'element').getBoundingClientRect();

        const relativeOffset = navOffset - elementLeftIndex;
        let maxWidth = elementLeftDimensions.width;
        let minWidth = elementRightDimensions.width;

        // flip min/max when the left one is bigger
        if(elementLeftDimensions.width > elementRightDimensions.width){
          minWidth = elementRightDimensions.width;
          maxWidth = elementLeftDimensions.width;
        }

        // map relativeOffset to correct ranges
        targetOffsetLeft  = relativeOffset * (elementRightDimensions.left - elementLeftDimensions.left) + elementLeftDimensions.left;
        targetWidth       = (1 - relativeOffset) * (maxWidth - minWidth) + minWidth;
      } else {
        targetOffsetLeft  = elementLeftDimensions.left;
        targetWidth       = elementLeftDimensions.width;
      }

      indicator.style.width = `${targetWidth}px`;
      indicator.style.left = `${targetOffsetLeft}px`;
    }
  }),

  childNavItems: computed.filter('children', function(view) {
    return view instanceof NavItem;
  }),
});
