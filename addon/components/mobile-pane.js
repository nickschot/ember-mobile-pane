import Component from '@ember/component';
import layout from '../templates/components/mobile-pane';

import { computed, get, set } from '@ember/object';
import RecognizerMixin from 'ember-gestures/mixins/recognizers';

import Pane from 'ember-mobile-pane/components/mobile-pane/pane';
import ComponentParentMixin from 'ember-mobile-pane/mixins/component-parent';

import { htmlSafe } from '@ember/string';

export default Component.extend(ComponentParentMixin, RecognizerMixin, {
  layout,

  classNames: ['mobile-pane'],
  classNameBindings: ['isDragging:mobile-pane--dragging'],
  recognizers: 'pan',

  // public
  triggerVelocity: 0.25,

  // private
  isDragging: false,

  childPanes: computed.filter('children', function(view) {
    return view instanceof Pane;
  }),
  childPaneCount: computed('childPanes.[]', function(){
    return get(this, 'childPanes').length;
  }),

  navItems: computed('childPanes.@each.{elementId,title}', function(){
    return get(this, 'childPanes').map((item, index) => {
      const result = item.getProperties('elementId', 'title');
      result.index = index;
      return result;
    });
  }),

  activeIndex: 0,
  activeElement: computed('activeIndex', function(){
    return get(this, 'childPanes').objectAt(get(this, 'activeIndex'));
  }),

  actions: {
    changePane(element){
      set(this, 'activeIndex', element.index);
    }
  },

  scrollerStyle: computed('childPaneCount', 'activeIndex', 'isDragging', 'dx', function(){
    let style  = `width: ${get(this, 'childPaneCount') * 100}%;`;

    let dx = 0;
    if(get(this, 'isDragging')){
      dx = get(this, 'dx');
    }

    style += `transform: translateX(${get(this, 'activeIndex') * -100 / get(this, 'childPaneCount') + dx}%)`;

    //TODO: don't use ember binds to set this
    return htmlSafe(style);
  }),

  _getMobilePaneWidth(){
    return get(this, 'element').clientWidth;
  },
  _isEnabled(e){
    const {
      center,
      pointerType
    } = e.originalEvent.gesture;

    return pointerType === 'touch'
      && !(center.x === 0 && center.y === 0); // workaround for https://github.com/hammerjs/hammer.js/issues/1132
  },

  // event handlers
  panStart(e){
    const {
      angle,
    } = e.originalEvent.gesture;

    if(this._isEnabled(e)){
      // only detect initial drag from left side of the window
      // only detect when angle is 30 deg or lower (fix for iOS)
      if(((angle > -25 && angle < 25) || (angle > 155 || angle < -155))
      ){
        // add a dragging class so any css transitions are disabled
        // and the pan event is enabled
        this.set('isDragging', true);
      }
    }
  },

  pan(e){
    const {
      deltaX
    } = e.originalEvent.gesture;

    if(this._isEnabled(e) && this.get('isDragging')){
      const activeIndex = get(this, 'activeIndex');
      const paneWidth = this._getMobilePaneWidth();
      const paneCount = get(this, 'childPaneCount');

      // limit dx to -1, +1 pane
      const dx = Math.max(Math.min(deltaX, paneWidth), -paneWidth);
      let targetOffset = 100 * dx / paneWidth / paneCount;

      // overscroll effect
      if(
           (activeIndex === 0 && targetOffset > 0)
        || (activeIndex === paneCount - 1 && targetOffset < 0)
      ) {
        targetOffset /= 3;
      }

      this.set('dx', targetOffset);
    }
  },

  panEnd(e) {
    const {
      overallVelocityX
    } = e.originalEvent.gesture;

    if(this._isEnabled(e) && this.get('isDragging', true)){
      this.set('isDragging', false);

      const dx = get(this, 'dx');
      const paneCount = get(this, 'childPaneCount');
      const currentIndex = get(this, 'activeIndex');
      const rawTargetIndex = dx * paneCount / -100;

      let targetIndex = Math.max(Math.min(currentIndex + Math.round(rawTargetIndex), paneCount - 1), 0);

      if(targetIndex === currentIndex){
        if(overallVelocityX < -1 * this.get('triggerVelocity') && targetIndex < paneCount - 1){
          targetIndex++;
        } else if(overallVelocityX > this.get('triggerVelocity') && targetIndex > 0){
          targetIndex--;
        }
      }

      set(this, 'activeIndex', targetIndex);
    }
  },

});
