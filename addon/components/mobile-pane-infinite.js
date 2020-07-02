import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { inject as service } from '@ember/service';
import { once } from '@ember/runloop';

/**
 * @class MobilePaneInfiniteComponent
 */
export default class MobilePaneInfiniteComponent extends Component {
  @service router;
  @service('memory-scroll') memory;

  /**
   * Model for the previous pane. Must be truthy to render the pane.
   *
   * @argument previousModel
   * @default null
   */

  /**
   * Model for the current pane.
   *
   * @argument currentModel
   * @required
   */

  /**
   * Model for the next pane.
   *
   * @argument nextModel
   * @default null
   */

  /**
   * Whether or not a router transition is triggered after pane change.
   *
   * @argument transitionAfterDrag
   * @default false
   * @private
   */

  /**
   * Whether or not panning is enabled
   *
   * @argument disabled
   * @type {boolean}
   * @default false
   */

  /**
   * Hook called when the active pane changes.
   *
   * @argument onChange
   * @param model The model that belongs to the new index
   * @param activeIndex The new index
   */

  /**
   * Hook called when a drag is started.
   *
   * @argument onDragStart
   */

  /**
   * Hook called when a drag moved.
   *
   * @argument onDragMove
   * @param dx The delta of the drag
   */

  /**
   * Hook called when a drag ended.
   *
   * @argument onDragEnd
   * @param activeIndex The index of the pane on which the drag ended
   */

  //private
  @tracked prevChildScroll = 0;
  @tracked currentChildScroll = 0;
  @tracked nextChildScroll = 0;
  @tracked childOffsetTop = 0;

  @action
  updateActiveIndex(){
    once(() => {
      // we received new models, restore the scroll
      this.restoreScroll();
    });
  }

  get activeIndex(){
    return this.args.previousModel ? 1 : 0;
  }

  get models() {
    return [this.args.previousModel, this.args.currentModel, this.args.nextModel].filter(Boolean);
  }

  @action
  onDragStart(){
    // write scroll offset for prev/next children
    this.childOffsetTop = document.scrollingElement.scrollTop || document.documentElement.scrollTop;

    if (this.args.onDragStart) {
      this.args.onDragStart(...arguments);
    }
  }

  @action
  onDragMove(){
    if (this.args.onDragMove) {
      this.args.onDragMove(...arguments);
    }
  }

  @action
  onDragEnd(targetIndex){
    // transition to previous or next model
    const targetModel = this.models[targetIndex];
    if(targetModel !== this.args.currentModel){
      // store the scroll position of currentModel
      this.storeScroll();
    }

    if (this.args.onDragEnd) {
      this.args.onDragEnd(targetIndex, targetModel);
    }
  }

  @action
  onChange(index){
    if (this.args.onChange) {
    this.args.onChange(this.models[index], index);
    }
  }

  storeScroll(){
    const key = this._buildMemoryKey(this.args.currentModel.id);
    this.memory[key] = document.scrollingElement.scrollTop || document.documentElement.scrollTop;
  }

  //TODO: purge scroll states if we came from a higher level route
  //TODO: make this function more robust & optional
  @action
  restoreScroll(){
    const prevKey     = this._buildMemoryKey(this.args.previousModel.id);
    const currentKey  = this._buildMemoryKey(this.args.currentModel.id);
    const nextKey     = this._buildMemoryKey(this.args.nextModel.id);

    this.prevChildScroll = this.memory[prevKey] || 0;
    this.currentChildScroll = this.memory[currentKey] || 0;
    this.nextChildScroll = this.memory[nextKey] || 0;
  }

  // utils
  _buildMemoryKey(id){
    return `mobile-pane/${this.router.currentRouteName}.${id}`;
  }
}
