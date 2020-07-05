import Component from '@glimmer/component';
import { action } from '@ember/object';
import { guidFor } from '@ember/object/internals';
import { assert } from '@ember/debug';
import { TrackedArray } from 'tracked-built-ins';

import NavItemComponent from './nav/item';

export default class NavComponent extends Component {
  element = null;
  elementId = guidFor(this);

  // public
  /**
   * Amount of padding on the left of the active nav item in px.
   *
   * @argument navScrollOffset
   * @default 75
   * @type {number}
   */
  get navScrollOffset () {
    return this.args.navScrollOffset ?? 75;
  }

  // private
  indicator = null;
  runningAnimation = null;
  items = new TrackedArray();

  // lifecycle
  @action
  setupIndicator(element) {
    this.indicator = element;
    this.updateStyle();
  }

  @action
  updateStyle(){
    const e1Index = Math.floor(this.args.relativeOffset);
    const e2Index = Math.ceil(this.args.relativeOffset);

    if(this.runningAnimation){
      this.runningAnimation.stop();
      this.runningAnimation = null;
    }

    if(this.items.length
      && e1Index < this.items.length
      && e2Index < this.items.length
    ){
      // the first element is always present
      const e1Dims         = this.items[e1Index].element.getBoundingClientRect();
      const e2Dims         = this.items[e2Index].element.getBoundingClientRect();
      const navDims        = this.element.getBoundingClientRect();
      const navLeft        = navDims.left;
      const navScrollLeft  = this.element.scrollLeft;

      let targetLeft  = e1Dims.left;
      let targetWidth = e1Dims.width;

      if(e1Index !== e2Index){
        const relativeOffset = this.args.relativeOffset - e1Index;

        // map relativeOffset to correct ranges
        targetLeft  = relativeOffset * (e2Dims.left - e1Dims.left) + e1Dims.left;
        targetWidth = (1 - relativeOffset) * (e1Dims.width - e2Dims.width) + e2Dims.width;
      }

      // correct for nav scroll and offset to viewport
      const scrollLeftTarget    = targetLeft - navLeft;
      const indicatorLeftTarget = scrollLeftTarget + navScrollLeft;

      // TODO: don't do this if the target index is already in range -> don't scroll back
      // change scroll based on indicator position
      if(scrollLeftTarget > 50){
        this.element.scrollLeft += scrollLeftTarget - this.navScrollOffset;
      } else {
        this.element.scrollLeft -= this.navScrollOffset - scrollLeftTarget;
      }
      this.indicator.style.transform = `translateX(${indicatorLeftTarget}px) scaleX(${targetWidth})`;
    }
  }

  @action
  registerItem(child) {
    assert('passed child instance must be a NavItemComponent', child instanceof NavItemComponent);
    this.items.push(child);
  }

  @action
  unregisterItem(child) {
    assert('passed child instance must be a NavItemComponent', child instanceof NavItemComponent);
    this.items.splice(this.items.indexOf(child), 1);
  }
}
