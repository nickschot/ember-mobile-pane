import Component from '@ember/component';
import layout from '../../templates/components/mobile-pane/nav';

import { computed, get, set } from '@ember/object';
import { next } from '@ember/runloop';

import ComponentParentMixin from 'ember-mobile-pane/mixins/component-parent';
import NavItem from 'ember-mobile-pane/components/mobile-pane/nav/item';
import Tween from 'ember-mobile-core/tween';

export default Component.extend(ComponentParentMixin, {
  layout,
  tagName: 'nav',

  classNames: ['mobile-pane__nav'],
  classNameBindings: [
    'isDragging:mobile-pane__nav--dragging',
    'transitionsEnabled:mobile-pane__nav--transitions'
  ],
  attributeBindings: ['dataStyle'],

  // public
  navScrollOffset: 75,
  transitionDuration: 200,

  // protected
  activeIndex: 0,
  activePane: null,
  isDragging: false,
  navItems: null,
  navOffset: 0,
  transitionsEnabled: true,

  // private
  indicator: null,

  /**
   * Fired when a nav item is clicked
   */
  onItemClick(){},

  // lifecycle
  didInsertElement(){
    set(this, 'indicator', document.getElementById(`${get(this, 'elementId')}-nav__indicator`));
  },

  //TODO: fix this binding
  dataStyle: computed('navOffset', 'activeIndex', 'childNavItems.@each.elementId', 'elementId', function(){
    const activeIndex     = get(this, 'activeIndex');
    const childNavItems   = get(this, 'childNavItems');
    const element         = get(this, 'element');
    const navOffset       = get(this, 'navOffset');
    const navScrollOffset = get(this, 'navScrollOffset');

    const e1Index = Math.floor(navOffset);
    const e2Index = Math.ceil(navOffset);

    if(childNavItems.length
      && e1Index < childNavItems.length
      && e2Index < childNavItems.length
    ){
      // the first element is always present
      const indicator         = get(this, 'indicator');
      const indicatorDims     = indicator.getBoundingClientRect();
      const e1Dims            = get(childNavItems.objectAt(e1Index), 'element').getBoundingClientRect();
      const e2Dims            = get(childNavItems.objectAt(e2Index), 'element').getBoundingClientRect();
      const navDims        = element.getBoundingClientRect();
      const navLeft        = navDims.left;
      const navScrollLeft  = element.scrollLeft;
      const navScrollWidth = element.scrollWidth;

      let targetLeft  = e1Dims.left;
      let targetWidth = e1Dims.width;

      if(e1Index !== e2Index){
        const relativeOffset = navOffset - e1Index;

        // map relativeOffset to correct ranges
        targetLeft  = relativeOffset * (e2Dims.left - e1Dims.left) + e1Dims.left;
        targetWidth = (1 - relativeOffset) * (e1Dims.width - e2Dims.width) + e2Dims.width;
      }

      // correct for nav scroll and offset to viewport
      const scrollLeftTarget    = targetLeft - navLeft;
      const indicatorLeftTarget = scrollLeftTarget + navScrollLeft;

      // make scroll follow pan and click
      const targetIsElement1 = navOffset - activeIndex < 0;
      const targetElementIndex = targetIsElement1 ? e1Index : e2Index;

      if(targetElementIndex === activeIndex){
        // pan ended or a menu change happened (i.e. by click)

        // change scroll based on target position
        const indicatorLeft       = indicatorDims.left + navScrollLeft;
        const indicatorWidth      = indicatorDims.width;

        const scrollLeftMax       = navScrollWidth - navDims.width;
        const targetElementLeft   = targetIsElement1 ? e1Dims.left : e2Dims.left;
        const scrollLeftTarget    = Math.max(Math.min(navScrollLeft + targetElementLeft - navScrollOffset - navLeft, scrollLeftMax), 0);

        const scrollDiff          = scrollLeftTarget - navScrollLeft;
        const indicatorLeftDiff   = indicatorLeftTarget - indicatorLeft;
        const indicatorWidthDiff  = targetWidth - indicatorWidth;

        const anim = new Tween((progress) => {
          element.scrollLeft = navScrollLeft + scrollDiff * progress;
          indicator.style.transform = `translateX(${indicatorLeft + indicatorLeftDiff * progress}px) scaleX(${indicatorWidth + indicatorWidthDiff * progress })`;
        }, { duration: get(this, 'transitionDuration')});
        anim.start();
      } else {
        // a pan is happening

        // change scroll based on indicator position
        if(scrollLeftTarget > 50){
          element.scrollLeft += scrollLeftTarget - navScrollOffset;
        } else {
          element.scrollLeft -= navScrollOffset - scrollLeftTarget;
        }
        indicator.style.transform = `translateX(${indicatorLeftTarget}px) scaleX(${targetWidth})`;
      }
    }
  }),

  childNavItems: computed.filter('children', function(view) {
    return view instanceof NavItem;
  }),
});
