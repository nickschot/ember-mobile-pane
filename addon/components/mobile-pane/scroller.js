import Component from '@ember/component';
import layout from '../../templates/components/mobile-pane/scroller';

import { computed, get, set } from '@ember/object';
import { htmlSafe } from '@ember/string';

import RecognizerMixin from 'ember-gestures/mixins/recognizers';

export default Component.extend(RecognizerMixin, {
  layout,
  classNames: ['mobile-pane__scroller'],
  attributeBindings: ['style'],
  recognizers: 'pan',

  // public
  overScrollFactor: 0.34, // between 0 and 1

  // protected
  activeIndex: 0,
  currentOffset: 0,
  lazyRendering: true,
  keepRendered: false,

  activePane: null,
  paneContainerElement: null,
  paneCount: 0,
  triggerVelocity: 0,
  visiblePanes: null,

  // private
  isDragging: false,
  dx: 0,

  onDragStart(){},
  onDragMove(dx){},
  onDragEnd(activeIndex){},

  style: computed('paneCount', 'currentOffset', function(){
    let style  = `width: ${get(this, 'paneCount') * 100}%;`;

    style += `transform: translateX(${get(this, 'currentOffset')}%)`;

    //TODO: don't use ember binds to set this
    return htmlSafe(style);
  }),

  // gesture recognition -------------------------------------------------------
  _getPaneWidth(){
    return get(this, 'paneContainerElement').clientWidth;
  },
  _isEnabled(e){
    const {
      center,
      pointerType
    } = e.originalEvent.gesture;

    return pointerType === 'touch'
      && !(center.x === 0 && center.y === 0); // workaround for https://github.com/hammerjs/hammer.js/issues/1132
  },

  panStart(e){
    if(this._isEnabled(e)){
      const {
        angle,
        additionalEvent
      } = e.originalEvent.gesture;

      const currentOffset = get(this, 'currentOffset');
      const maxOffset = -100 / get(this, 'paneCount') ;

      // Only detect when angle is 30 deg or lower (fix for iOS).
      // Prevent capturing the pan events when overScroll is off and we're
      // at the end of the scroller.
      if(
        ((angle > -25 && angle < 25) || (angle > 155 || angle < -155))
        && !(get(this, 'overScrollFactor') === 0 && (
             (currentOffset === 0 && additionalEvent === 'panright')
          || (currentOffset === maxOffset && additionalEvent === 'panleft')
        ))
      ){
        e.stopPropagation();
        // add a dragging class so any css transitions are disabled
        // and the pan event is enabled
        this.set('isDragging', true);

        this.get('onDragStart')();
      }
    }
  },

  pan(e){
    if(this._isEnabled(e) && this.get('isDragging')){
      e.stopPropagation();

      const {
        deltaX
      } = e.originalEvent.gesture;

      const activeIndex = get(this, 'activeIndex');
      const paneWidth = this._getPaneWidth();
      const paneCount = get(this, 'paneCount');

      // limit dx to -1, +1 pane
      const dx = Math.max(Math.min(deltaX, paneWidth), -paneWidth);
      let targetOffset = 100 * dx / paneWidth / paneCount;

      // overscroll effect
      if(
        (activeIndex === 0 && targetOffset > 0)
        || (activeIndex === paneCount - 1 && targetOffset < 0)
      ) {
        targetOffset *= get(this, 'overScrollFactor');
      }

      this.set('dx', targetOffset);

      this.get('onDragMove')(targetOffset);
    }
  },

  panEnd(e) {
    if(this._isEnabled(e) && this.get('isDragging', true)){
      e.stopPropagation();

      const {
        overallVelocityX
      } = e.originalEvent.gesture;

      this.set('isDragging', false);

      const dx = get(this, 'dx');
      const paneCount = get(this, 'paneCount');
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

      set(this, 'dx', 0);

      this.get('onDragEnd')(targetIndex);
    }
  },
});
