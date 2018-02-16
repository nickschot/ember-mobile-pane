import Component from '@ember/component';
import layout from '../../templates/components/mobile-pane/scroller';

import { computed, get, set } from '@ember/object';
import { htmlSafe } from '@ember/string';

import RecognizerMixin from 'ember-mobile-core/mixins/pan-recognizer';

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
  didPanStart(e){
    const {
      angle,
      additionalEvent
    } = e.current;
    console.log('pan pane', e);

    const activeIndex = get(this, 'activeIndex');

    // Only detect when angle is 30 deg or lower (fix for iOS).
    // Prevent capturing the pan events when overScroll is off and we're
    // at the end of the scroller.
    if(
      ((angle > -25 && angle < 25) || (angle > 155 || angle < -155))
      && !(get(this, 'overScrollFactor') === 0 && (
           (activeIndex === 0 && additionalEvent === 'panright')
        || (activeIndex === get(this, 'paneCount') - 1 && additionalEvent === 'panleft')
      ))
    ){
      this.lockPan();
      // add a dragging class so any css transitions are disabled
      // and the pan event is enabled
      this.set('isDragging', true);

      this.get('onDragStart')();
    }
  },

  didPan(e){
    if(this.get('isDragging')){
      const {
        distanceX
      } = e.current;

      const activeIndex = get(this, 'activeIndex');
      const paneWidth = this._getPaneWidth();
      const paneCount = get(this, 'paneCount');

      // limit dx to -1, +1 pane
      const dx = Math.max(Math.min(distanceX, paneWidth), -paneWidth);
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

  didPanEnd(e) {
    if(this.get('isDragging', true)){
      const {
        velocityX
      } = e.current;

      this.set('isDragging', false);

      const dx = get(this, 'dx');
      const paneCount = get(this, 'paneCount');
      const currentIndex = get(this, 'activeIndex');
      const rawTargetIndex = dx * paneCount / -100;

      let targetIndex = Math.max(Math.min(currentIndex + Math.round(rawTargetIndex), paneCount - 1), 0);

      if(targetIndex === currentIndex){
        if(velocityX < -1 * this.get('triggerVelocity') && targetIndex < paneCount - 1){
          targetIndex++;
        } else if(velocityX > this.get('triggerVelocity') && targetIndex > 0){
          targetIndex--;
        }
      }

      set(this, 'dx', 0);

      this.get('onDragEnd')(targetIndex);
    }
  },
});
