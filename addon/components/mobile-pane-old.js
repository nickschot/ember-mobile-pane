import Component from '@ember/component';
import layout from '../templates/components/mobile-pane-old';

import { htmlSafe } from '@ember/string';
import { computed } from '@ember/object';
import { inject as service } from '@ember/service';
import { A } from '@ember/array';
import { getOwner } from "@ember/application";
import { scheduleOnce } from '@ember/runloop';
import RecognizerMixin from 'ember-mobile-core/mixins/pan-recognizer';

//TODO: when transitioning in from some route which doesn't match, reset scroll
//TODO: add breakpoint support to disable rendering of left/right components
export default Component.extend(RecognizerMixin, {
  layout,

  classNames: ['mobile-pane-old'],
  classNameBindings: ['isDragging:mobile-pane--dragging', 'finishAnimation:mobile-pane--transitioning'],

  router: service(),
  memory: service('memory-scroll'),
  fastboot: service(),
  isFastBoot: computed.reads('fastboot.isFastBoot'),

  // public attributes
  slideableModels: null,
  currentModel: null,
  leftOpenDetectionWidth: 10,
  transitionDuration: 200,
  triggerVelocity: 0.25,

  // private attributes
  isDragging: false,
  finishAnimation: false,

  // computed properties
  currentModelIndex: computed('slideableModels.[]', 'currentModel', function(){
    return this.get('slideableModels').indexOf(this.get('currentModel'));
  }),

  previousModel: computed('slideableModels.[]', 'currentModelIndex', function(){
    return this.get('currentModelIndex') > 0
      ? this.get('slideableModels').objectAt(this.get('currentModelIndex') - 1)
      : null;
  }),

  nextModel: computed('slideableModels.[]', 'currentModelIndex', function(){
    return this.get('currentModelIndex') + 1 < this.get('slideableModels.length')
      ? this.get('slideableModels').objectAt(this.get('currentModelIndex') + 1)
      : null;
  }),

  containerStyle: computed('currentPosition', function(){
    return htmlSafe(`transform: translateX(${this.get('currentPosition')}vw)`);
  }),

  scrollOffset: computed('currentScroll', function(){
    return htmlSafe(`top: ${this.get('currentScroll')}px`);
  }),

  currentRouteName: computed(function(){
    return getOwner(this).lookup('controller:application').get('currentRouteName');
  }),

  // event handlers
  didPanStart(e){
    const {
      x,
      angle,
    } = e.current;

    // don't allow pan start while the animation is finishing (for now)
    if(!this.get('finishAnimation')){

      // write scroll offset for prev/next children
      this.set('currentScroll', document.scrollingElement.scrollTop || document.documentElement.scrollTop);

      const windowWidth = this._getWindowWidth();
      const startOffset = 100 * x / windowWidth;

      // only detect when angle is 30 deg or lower (fix for iOS)
      if((angle > -25 && angle < 25) || (angle > 155 || angle < -155)){
        // add a dragging class so any css transitions are disabled
        // and the pan event is enabled
        this.set('isDragging', true);
      }
    }
  },

  didPan(e){
    const {
      distanceX
    } = e.current;

    if(this.get('isDragging')){
      const windowWidth = this._getWindowWidth();

      // initial target offset calculation
      let targetOffset = 100 * distanceX / windowWidth;

      // overflow scrolling bounds
      const targetOffsetMin = this.get('nextModel')     ? -100 : -34;
      const targetOffsetMax = this.get('previousModel') ?  100 :  34;

      // calculate overflow scroll offset
      if(  (!this.get('nextModel') && targetOffset < 0)
        || (!this.get('previousModel') && targetOffset > 0)
      ){
        targetOffset = 100 * (distanceX / 3) / windowWidth;
      }

      // pass the new position taking limits into account
      if(targetOffset < targetOffsetMin){
        targetOffset = targetOffsetMin;
      } else if(targetOffset > targetOffsetMax){
        targetOffset = targetOffsetMax;
      }

      this.set('currentPosition', targetOffset);
    }
  },

  didPanEnd(e) {
    const {
      velocityX
    } = e.current;

    if(this.get('isDragging')){
      this.set('isDragging', false);
      this.set('finishAnimation', true);

      //TODO: clean up all timeouts
      setTimeout(() => {
        this.set('finishAnimation', false);
      }, this.get('transitionDuration'));

      const currentPosition = this.get('currentPosition');
      const currentRouteName = getOwner(this).lookup('controller:application').get('currentRouteName');

      // when position has the overhand or overall horizontal velocity is high,
      // transition to the prev/next model
      if(
        currentPosition < -50
        || (
          this.get('nextModel')
          && velocityX < -1 * this.get('triggerVelocity')
        )
      ){
        this.set('currentPosition', -100);
        this.storeScroll();

        const targetModel = this.get('nextModel');
        setTimeout(() => {
          this.get('router').transitionTo(currentRouteName, targetModel);
        }, this.get('transitionDuration'));
      } else if(
        currentPosition > 50
        || (
          this.get('previousModel')
          && velocityX > this.get('triggerVelocity')
        )
      ){
        this.set('currentPosition', 100);
        this.storeScroll();

        const targetModel = this.get('previousModel');
        setTimeout(() => {
          this.get('router').transitionTo(currentRouteName, targetModel);
        }, this.get('transitionDuration'));
      } else {
        this.set('currentPosition', 0);
      }
    }
  },

  didReceiveAttrs(){
    this._super(...arguments);

    this.set('currentPosition', 0);
    scheduleOnce('afterRender', () => { this.restoreScroll(); });
  },

  // functions
  //TODO: dont run store/restore scroll when in fastboot mode
  storeScroll(){
    if(!this.get('isFastBoot')){
      //const elem = this.element.querySelector('.mobile-pane__container .child--current');
      const key = this._buildMemoryKey(this.get('currentModel.id'));

      this.get('memory')[key] = document.scrollingElement.scrollTop || document.documentElement.scrollTop;//elem.scrollTop;
    }
  },

  //TODO: only do this within the route
  restoreScroll(){
    if(!this.get('isFastBoot')){
      const prevKey     = this._buildMemoryKey(this.get('previousModel.id'));
      const currentKey  = this._buildMemoryKey(this.get('currentModel.id'));
      const nextKey     = this._buildMemoryKey(this.get('nextModel.id'));

      const prev    = this.element.querySelector('.mobile-pane__container .child--previous');
      const current = document.scrollingElement || document.documentElement;
      const next    = this.element.querySelector('.mobile-pane__container .child--next');

      if(prev) prev.scrollTop    = this.get('memory')[prevKey] || 0;
      current.scrollTop = this.get('memory')[currentKey] || 0;
      if(next) next.scrollTop    = this.get('memory')[nextKey] || 0;
    }
  },

  // utils
  _getWindowWidth(){
    return window.innerWidth || document.documentElement.clientWidth || document.getElementsByTagName('body')[0].clientWidth;
  },

  _buildMemoryKey(id){
    return `mobile-pane/${this.get('currentRouteName')}.${id}`;
  }
});
