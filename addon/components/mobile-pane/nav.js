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
      const e1Dims            = get(childNavItems.objectAt(e1Index), 'element').getBoundingClientRect();
      const e2Dims            = get(childNavItems.objectAt(e2Index), 'element').getBoundingClientRect();
      const parentLeft        = element.getBoundingClientRect().left;
      const parentScrollLeft  = element.scrollLeft;
      const indicator         = get(this, 'indicator');

      let targetLeft  = e1Dims.left;
      let targetWidth = e1Dims.width;

      const relativeOffset = navOffset - e1Index;

      if(e1Index !== e2Index){
        // map relativeOffset to correct ranges
        targetLeft  = relativeOffset * (e2Dims.left - e1Dims.left) + e1Dims.left;
        targetWidth = (1 - relativeOffset) * (e1Dims.width - e2Dims.width) + e2Dims.width;
      }

      // correct for nav scroll and offset to viewport
      const targetScrollLeft    = targetLeft - parentLeft;
      const indicatorLeft       = targetScrollLeft + parentScrollLeft;
      const indicatorTransform  = `translateX(${indicatorLeft}px) scaleX(${targetWidth})`;

      // make scroll follow pan and click
      const targetIsElement1 = navOffset - activeIndex < 0;
      const targetElementIndex = targetIsElement1 ? e1Index : e2Index;

      if(targetElementIndex === activeIndex){
        // pan ended or a menu change happened (i.e. by click)

        // make sure the isDragging class binding came through after drag ended
        // TODO: find out if we can do without the runloop hack.
        // TODO: Note: we can do the above if we remove the transform and just use the Tween
        next(() => {
          // change scroll based on target position
          const scrollLeft = element.scrollLeft;
          const maxScrollLeft = element.scrollWidth - element.getBoundingClientRect().width;
          const targetElementLeft = targetIsElement1 ? e1Dims.left : e2Dims.left;
          const targetScrollLeft  = Math.max(Math.min(scrollLeft + targetElementLeft - navScrollOffset - parentLeft, maxScrollLeft), 0);

          indicator.style.transform = indicatorTransform;

          const diff = targetScrollLeft - scrollLeft;
          const anim = new Tween((progress) => {
            this.element.scrollLeft = scrollLeft + diff * progress;
          }, { duration: 200, ease: 'linear' });
          anim.start();
        });
      } else {
        // a pan is happening

        // change scroll based on indicator position
        //const targetScrollLeft = indicatorLeft - parentScrollLeft;
        if(targetScrollLeft > 50){
          element.scrollLeft += targetScrollLeft - navScrollOffset;
        } else {
          element.scrollLeft -= navScrollOffset - targetScrollLeft;
        }
        indicator.style.transform = indicatorTransform;
      }
    }
  }),

  childNavItems: computed.filter('children', function(view) {
    return view instanceof NavItem;
  }),
});
