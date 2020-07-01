import { filter } from '@ember/object/computed';
import Component from '@ember/component';
import layout from '../../templates/components/mobile-pane/nav';

import { computed, get, set, observer } from '@ember/object';
import { once } from '@ember/runloop';

import ComponentParentMixin from 'ember-mobile-pane/mixins/component-parent';
import NavItem from 'ember-mobile-pane/components/mobile-pane/nav/item';
import Tween from 'ember-mobile-core/tween';

export default Component.extend(ComponentParentMixin, {
  layout,
  tagName: 'nav',

  classNames: ['mobile-pane__nav'],

  // public
  navScrollOffset: 75,
  transitionDuration: 0,

  // protected
  activeIndex: 0,
  activePane: null,
  navItems: null,
  navOffset: 0,
  transitionsEnabled: true,

  // private
  indicator: null,
  initialRender: true,
  runningAnimation: null,

  /**
   * Fired when a nav item is clicked
   */
  onItemClick(){},

  // lifecycle
  didInsertElement(){
    this._super(...arguments);

    set(this, 'indicator', document.getElementById(`${this.elementId}-nav__indicator`));

    this._updateStyle();
  },

  childNavItems: filter('children', function(view) {
    return view instanceof NavItem;
  }),

  updateStyle: observer(
    'navOffset',
    'activeIndex',
    'childNavItems.@each.elementId',
    'elementId',
    function(){
      once(this, this._updateStyle);
    }
  ),

  _updateStyle(){
    const activeIndex     = this.activeIndex;
    const childNavItems   = this.childNavItems;
    const element         = this.element;
    const navOffset       = this.navOffset;
    const navScrollOffset = this.navScrollOffset;

    const e1Index = Math.floor(navOffset);
    const e2Index = Math.ceil(navOffset);

    if(this.runningAnimation){
      this.runningAnimation.stop();
      set(this, 'runningAnimation', null);
    }

    if(childNavItems.length
      && e1Index < childNavItems.length
      && e2Index < childNavItems.length
    ){
      // the first element is always present
      const e1Dims         = get(childNavItems.objectAt(e1Index), 'element').getBoundingClientRect();
      const e2Dims         = get(childNavItems.objectAt(e2Index), 'element').getBoundingClientRect();
      const navDims        = element.getBoundingClientRect();
      const navLeft        = navDims.left;
      const navScrollLeft  = element.scrollLeft;

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

        this._finishTransition(navDims, e1Dims, e2Dims, navScrollLeft, navScrollOffset, indicatorLeftTarget, targetWidth, targetIsElement1);
      } else {
        // a pan is happening

        this._followPan(scrollLeftTarget, navScrollOffset, indicatorLeftTarget, targetWidth);
      }
    }
  },

  _finishTransition(navDims, e1Dims, e2Dims, navScrollLeft, navScrollOffset, indicatorLeftTarget, indicatorWidthTarget, targetIsElement1){
    const indicatorDims  = this.indicator.getBoundingClientRect();
    const navScrollWidth = this.element.scrollWidth;

    // change scroll based on target position
    const indicatorLeft       = indicatorDims.left + navScrollLeft - navDims.left;
    const indicatorWidth      = indicatorDims.width;

    const scrollLeftMax       = navScrollWidth - navDims.width;
    const targetElementLeft   = targetIsElement1 ? e1Dims.left : e2Dims.left;
    const scrollLeftTarget    = Math.max(Math.min(navScrollLeft + targetElementLeft - navScrollOffset - navDims.left, scrollLeftMax), 0);

    const scrollDiff          = scrollLeftTarget - navScrollLeft;
    const indicatorLeftDiff   = indicatorLeftTarget - indicatorLeft;
    const indicatorWidthDiff  = indicatorWidthTarget - indicatorWidth;

    if(scrollDiff !== 0 || indicatorLeftDiff !== 0 || indicatorWidthDiff !== 0){
      if(this.initialRender){
        this._applyStyle(
          navScrollLeft + scrollDiff,
          indicatorLeft + indicatorLeftDiff,
          indicatorWidth + indicatorWidthDiff
        );
        set(this, 'initialRender', false);
      } else {
        const anim = new Tween((progress) => {
          this._applyStyle(
            navScrollLeft + scrollDiff * progress,
            indicatorLeft + indicatorLeftDiff * progress,
            indicatorWidth + indicatorWidthDiff * progress
          );
        }, { duration: this.transitionDuration});
        set(this, 'runningAnimation', anim);
        anim.start();
      }
    }
  },
  _followPan(scrollLeftTarget, navScrollOffset, indicatorLeftTarget, indicatorWidthTarget){
    // change scroll based on indicator position
    if(scrollLeftTarget > 50){
      this.element.scrollLeft += scrollLeftTarget - navScrollOffset;
    } else {
      this.element.scrollLeft -= navScrollOffset - scrollLeftTarget;
    }
    this.indicator.style.transform = `translateX(${indicatorLeftTarget}px) scaleX(${indicatorWidthTarget})`;
  },

  _applyStyle(scrollLeft, indicatorLeft, indicatorWidth){
    this.element.scrollLeft = scrollLeft;
    this.indicator.style.transform = `translateX(${indicatorLeft}px) scaleX(${indicatorWidth})`;
  }
});
