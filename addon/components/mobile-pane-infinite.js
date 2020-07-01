import Component from '@ember/component';
import layout from '../templates/components/mobile-pane-infinite';

import { inject as service } from '@ember/service';
import { get, set, computed, observer } from '@ember/object';
import { once } from '@ember/runloop';
import { A } from '@ember/array';

/**
 * @class MobilePaneInfiniteComponent
 */
export default Component.extend({
  layout,

  classNames: ['mobile-pane__infinite-scroller'],

  router: service(),
  memory: service('memory-scroll'),

  /**
   * Model for the previous pane. Must be truthy to render the pane.
   *
   * @argument previousModel
   * @default null
   */
  previousModel: null,

  /**
   * Model for the current pane.
   *
   * @argument currentModel
   * @required
   */
  currentModel: null,

  /**
   * Model for the next pane.
   *
   * @argument nextModel
   * @default null
   */
  nextModel: null,

  /**
   * Whether or not a router transition is triggered after pane change.
   *
   * @argument transitionAfterDrag
   * @default false
   * @private
   */
  transitionAfterDrag: false,

  /**
   * Whether or not panning is enabled
   *
   * @argument disabled
   * @type {boolean}
   * @default false
   */
  disabled: false,

  /**
   * Hook called when the active pane changes.
   *
   * @argument onChange
   * @param model The model that belongs to the new index
   * @param activeIndex The new index
   */
  onChange(model, activeIndex){}, //eslint-disable-line no-unused-vars

  //private
  prevChildScroll: 0,
  currentChildScroll: 0,
  nextChildScroll: 0,
  childOffsetTop: 0,

  onDragStart(){},
  onDragMove(dx){}, //eslint-disable-line no-unused-vars
  onDragEnd(activeIndex){}, //eslint-disable-line no-unused-vars

  didInsertElement(){
    this._super(...arguments);

    //TODO: purge scroll states if we came from a higher level route
    this.restoreScroll();
  },

  updateActiveIndex: observer('models.@each.id', function(){
    once(() => {
      // we received new models, restore the scroll
      this.restoreScroll();
    });
  }),

  activeIndex: computed('previousModel', function(){
    return this.previousModel ? 1 : 0;
  }),

  models: computed('previousModel', 'currentModel', 'nextModel', function(){
    return A([this.previousModel, this.currentModel, this.nextModel].filter(Boolean));
  }),

  actions: {
    onDragStart(){
      // write scroll offset for prev/next children
      set(this, 'childOffsetTop', document.scrollingElement.scrollTop || document.documentElement.scrollTop);

      this.onDragStart(...arguments);
    },
    onDragMove(){
      this.onDragMove(...arguments);
    },
    onDragEnd(targetIndex){
      // transition to previous or next model
      const targetModel = this.models.objectAt(targetIndex);
      if(targetModel !== this.currentModel){
        // store the scroll position of currentModel
        this.storeScroll();
      }

      this.onDragEnd(targetIndex, targetModel);
    },
    onChange(index){
      this.onChange(this.models.objectAt(index), index);
    }
  },

  storeScroll(){
    const key = this._buildMemoryKey(this.get('currentModel.id'));
    this.memory[key] = document.scrollingElement.scrollTop || document.documentElement.scrollTop;
  },

  restoreScroll(){
    const prevKey     = this._buildMemoryKey(this.get('previousModel.id'));
    const currentKey  = this._buildMemoryKey(this.get('currentModel.id'));
    const nextKey     = this._buildMemoryKey(this.get('nextModel.id'));

    set(this, 'prevChildScroll', this.memory[prevKey] || 0);
    set(this, 'currentChildScroll', this.memory[currentKey] || 0);
    set(this, 'nextChildScroll', this.memory[nextKey] || 0);
  },

  // utils
  _buildMemoryKey(id){
    return `mobile-pane/${this.get('router.currentRouteName')}.${id}`;
  }
});
