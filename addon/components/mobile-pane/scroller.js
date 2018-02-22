import Component from '@ember/component';
import layout from '../../templates/components/mobile-pane/scroller';

import { computed, get, set } from '@ember/object';
import { htmlSafe } from '@ember/string';

import RecognizerMixin from 'ember-mobile-core/mixins/pan-recognizer';
import Tween from 'ember-mobile-core/tween';

export default Component.extend(RecognizerMixin, {
  layout,
  classNames: ['mobile-pane__scroller'],
  attributeBindings: ['style'],

  // public
  overScrollFactor: 0.34, // between 0 and 1

  // protected
  activeIndex: 0,
  lazyRendering: true,
  keepRendered: false,
  transitionDuration: 0,

  activePane: null,
  paneContainerElement: null,
  paneCount: 0,
  triggerVelocity: 0,
  visiblePanes: null,

  // private
  isDragging: false,
  dx: 0,
  dxStart: 0,
  runningAnimation: null,

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
      distanceX
    } = e.current;

    const activeIndex = get(this, 'activeIndex');

    // Only detect when angle is 30 deg or lower (fix for iOS).
    // Prevent capturing the pan events when overScroll is off and we're
    // at the end of the scroller.
    if(
      ((angle > -25 && angle < 25) || (angle > 155 || angle < -155))//TODO: maybe move this into the pan detection
      && !(get(this, 'overScrollFactor') === 0 && (
           (activeIndex === 0 && distanceX > 0)
        || (activeIndex === get(this, 'paneCount') - 1 && distanceX < 0)
      ))
    ){
      this.lockPan();
      // add a dragging class so any css transitions are disabled
      // and the pan event is enabled
      this.set('isDragging', true);

      const anim = get(this, 'runningAnimation');
      if(anim){
        anim.stop();
        set(this, 'runningAnimation', null);
        set(this, 'dxStart', get(this, 'dx'));
      } else {
        set(this, 'dxStart', 0);
      }

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

      const targetDistanceX = get(this, 'dxStart') / 100 * paneWidth * paneCount + distanceX;

      // limit dx to -1, +1 pane
      const dx = Math.max(Math.min(targetDistanceX, paneWidth), -paneWidth);
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

      this.finishTransition(targetIndex);
    }
  },

  async finishTransition(targetIndex){
    const dx = get(this, 'dx');
    const currentIndex = get(this, 'activeIndex');
    const target = (targetIndex - currentIndex) * (-100 / get(this, 'paneCount')) - dx;

    const anim = new Tween((progress) => {
      const currentPos = dx + target * progress;
      set(this, 'dx', currentPos);
      this.onDragMove(currentPos);
    }, { duration: get(this, 'transitionDuration')});
    set(this, 'runningAnimation', anim);
    await anim.start();

    set(this, 'runningAnimation', null);
    set(this, 'dx', 0);

    this.get('onDragEnd')(targetIndex);
  }
});
