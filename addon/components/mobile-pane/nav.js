import Component from '@ember/component';
import layout from '../../templates/components/mobile-pane/nav';

import ComponentParentMixin from 'ember-mobile-pane/mixins/component-parent';
import NavItem from 'ember-mobile-pane/components/mobile-pane/nav/item';
import { computed, get, set, observer } from '@ember/object';

export default Component.extend(ComponentParentMixin, {
  layout,
  tagName: 'nav',

  classNames: ['mobile-pane__nav'],

  onItemClick(){},

  navOffsetChanged: observer('navOffset', 'activeIndex', 'childNavItems.@each.elementId', 'elementId', function(){
    const childNavItems = get(this, 'childNavItems');
    const navOffset = get(this, 'navOffset');
    const activeIndex = get(this, 'activeIndex');
    const navScrollLeftOffset = 75;

    const e1Index = Math.floor(navOffset);
    const e2Index = Math.ceil(navOffset);

    if(childNavItems.length
      && e1Index < childNavItems.length
      && e2Index < childNavItems.length
    ){
      // the first element is always present
      const e1Dims  = get(childNavItems.objectAt(e1Index), 'element').getBoundingClientRect();
      const e2Dims = get(childNavItems.objectAt(e2Index), 'element').getBoundingClientRect();

      let targetLeft  = e1Dims.left;
      let targetWidth = e1Dims.width;

      const relativeOffset = navOffset - e1Index;

      if(e1Index !== e2Index){
        // map relativeOffset to correct ranges
        targetLeft  = relativeOffset * (e2Dims.left - e1Dims.left) + e1Dims.left;
        targetWidth = (1 - relativeOffset) * (e1Dims.width - e2Dims.width) + e2Dims.width;
      }

      const indicator = document.getElementById(`${get(this, 'elementId')}-nav__indicator`);

      // correct for nav scroll and offset to viewport
      const parentLeft = get(this, 'element').getBoundingClientRect().left;
      const parentScrollLeft = get(this, 'element').scrollLeft;

      //indicator.style.width = `${targetWidth}px`;
      //indicator.style.left  = `${targetLeft - parentLeft + parentScrollLeft}px`;

      // make scroll follow pan and click
      const targetIsElement1 = navOffset - activeIndex < 0;
      const targetElementIndex = targetIsElement1 ? e1Index : e2Index;

      if(targetElementIndex === activeIndex){
        // activeIndex was not changed by panning
        // change scroll based on target position
        const targetElementLeft = targetIsElement1 ? e1Dims.left : e2Dims.left;
        const targetScrollLeft = get(this, 'element').scrollLeft + (targetElementLeft - navScrollLeftOffset);

        //TODO: remove this when animation loop has been implemented
        //get(this, 'element').scrollLeft += targetElementLeft - navScrollLeftOffset;

        //TODO: replace with custom rAF animation loop
        $(this.element).animate({scrollLeft: targetScrollLeft}, 200, 'linear');
      } else {
        // activeIndex was changed by panning
        // change scroll based on indicator position
        const fromLeft = indicator.getBoundingClientRect().left - parentLeft;

        if(fromLeft > 50){
          get(this, 'element').scrollLeft += fromLeft - navScrollLeftOffset;
        } else {
          get(this, 'element').scrollLeft -= navScrollLeftOffset - fromLeft;
        }
      }

      indicator.style.width = `${targetWidth}px`;
      indicator.style.left  = `${targetLeft - parentLeft + parentScrollLeft}px`;
    }
  }),

  childNavItems: computed.filter('children', function(view) {
    return view instanceof NavItem;
  }),
});
