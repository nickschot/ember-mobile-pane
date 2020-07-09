import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { assert } from '@ember/debug';
import { TrackedArray } from 'tracked-built-ins';
import { task } from 'ember-concurrency';
import PaneComponent from 'ember-mobile-pane/components/mobile-pane/pane';
import Spring from '../spring';

//TODO: delay (normal) lazyRendering until after the animation has completed to prevent stutter

/**
 * @class MobilePaneComponent
 * @public
 */
export default class MobilePaneComponent extends Component {
  // public

  /**
   * Index of the active pane.
   *
   * @argument activeIndex
   * @type {Number} Must be an integer
   * @default 0
   */
  get activeIndex() {
    return this.args.activeIndex ?? 0;
  }

  /**
   * Velocity necessary to trigger a "swipe".
   *
   * @argument triggerVelocity
   * @type {Number}
   * @default 0.3
   */
  get triggerVelocity() {
    return this.args.triggerVelocity ?? 0.3;
  }

  /**
   * Duration of the finish animation in ms.
   *
   * @argument transitionDuration
   * @type {Number}
   * @default 300
   */
  get transitionDuration() {
    return this.args.transitionDuration ?? 300
  }

  /**
   * Renders the active pane and it's direct neighbours.
   *
   * @argument lazyRendering
   * @type {Boolean}
   * @default true
   */
  get lazyRendering() {
    return this.args.lazyRendering ?? true;
  }

  /**
   * Renders panes only when they are in the current viewport.
   *
   * @argument strictLazyRendering
   * @type {Boolean}
   * @default false
   */
  get strictLazyRendering() {
    return this.args.strictLazyRendering ?? false;
  }

  /**
   * Deadzone for how far a pane must be in the viewport to be rendered
   *
   * @argument strictLazyRenderingDeadZone
   * @type {Number} between 0 and 1.0
   * @default 0
   */
  get strictLazyRenderingDeadZone() {
    return this.args.strictLazyRenderingDeadZone ?? 0;
  }

  /**
   * Keep the pane content rendered after the initial render
   *
   * @argument keepRendered
   * @type {Boolean}
   * @default false
   */
  get keepRendered() {
    return this.args.keepRendered ?? false;
  }

  /**
   * Whether or not panning is enabled
   *
   * @argument disabled
   * @type {boolean}
   * @default false
   */
  get disabled() {
    return this.args.disabled ?? false;
  }

  /**
   * Hook fired when the active pane changed.
   *
   * @argument onChange
   * @type {Function}
   * @default function(activeIndex){}
   */

  /**
   * Hook fired when a drag started.
   *
   * @argument onDragStart
   * @type {Function}
   * @default function(){}
   */

  /**
   * Hook fired when a drag moved.
   *
   * @argument onDragMove
   * @type {Function}
   * @default function(dx){}
   */

  /**
   * Hook fired when a drag ended.
   *
   * @argument onDragEnd
   * @type {Function}
   * @default function(activeIndex){}
   */

  /**
   * True if the user is dragging in the pane.
   *
   * @property isDragging
   * @type {Boolean}
   * @default false
   * @private
   */
  @tracked isDragging = false;

  /**
   * Current offset in px.
   *
   * @property dx
   * @type {Number}
   * @default 0
   * @private
   */
  @tracked dx = 0;
  preservedDx = 0;

  @tracked paneWidth = 0;
  panes = new TrackedArray();

  /**
   * True if lazy rendering is enabled.
   *
   * @property _lazyRendering
   * @private
   */
  get _lazyRendering() {
    return this.lazyRendering || this.strictLazyRendering;
  }

  get paneCount() {
    return this.panes.length;
  }

  get navItems() {
    return this.panes.map((item, index) => ({
      elementId: item.elementId,
      title: item.title,
      index
    }));
  }

  /**
   * Returns the active pane.
   *
   * @property activePane
   * @type {PaneComponent}
   * @private
   */
  get activePane() {
    return this.panes[this.activeIndex];
  }

  get procentualOffset (){
    // don't divide by 0
    return this.paneCount !== 0
      ? this.activeIndex * -100 / this.paneCount + this.dx
      : this.dx;
  }

  get relativeOffset (){
    return Math.min(Math.max(this.procentualOffset * this.paneCount / -100, 0), this.paneCount - 1);
  }

  /**
   * Returns the panes which should be rendered when lazy rendering is enabled.
   *
   * @property visiblePanes
   * @private
   */
  get visiblePanes() {
    const activeIndex = Math.round(this.relativeOffset);
    const visibleIndices = [activeIndex];

    if(this.strictLazyRendering){
      const lazyOffset = this.relativeOffset - activeIndex;

      if(Math.abs(lazyOffset) > this.strictLazyRenderingDeadZone){
        const visibleNeighborIndex = lazyOffset > 0
          ? Math.ceil(this.relativeOffset)
          : Math.floor(this.relativeOffset);

        visibleIndices.push(visibleNeighborIndex);
      }
    } else {
      visibleIndices.push(activeIndex-1, activeIndex+1);
    }

    return this.panes
      .filter((item, index) => visibleIndices.includes(index))
      .map(item => ({ elementId: item.elementId }));
  }

  @action
  onDragStart(){
    this.isDragging = true;
    if (this.finishTransitionTask.isRunning) {
      this.finishTransitionTask.cancelAll();
    }

    if (this.args.onDragStart) {
      this.args.onDragStart();
    }
  }

  @action
  onDragMove(dx){
    this.dx = dx + this.preservedDx;

    if (this.args.onDragMove) {
      this.args.onDragMove(dx);
    }
  }

  @action
  async onDragEnd(activeIndex, finishTransition = false){
    if (finishTransition) {
      await this.finishTransition(activeIndex);
    }

    this.isDragging = false;
    this.dx = 0;

    if (this.args.onDragEnd) {
      this.args.onDragEnd(activeIndex);
    }

    if(activeIndex !== this.activeIndex && this.args.onChange){
      this.args.onChange(activeIndex);
    }
  }

  @action
  async moveToPane(index) {
    await this.finishTransition(index);
    this.args.onChange(...arguments)
  }

  @(task(function*(targetIndex, currentVelocity){
    const startPos = this.dx;
    const endPos = (targetIndex - this.activeIndex) * (-100 / this.paneCount);

    const spring = new Spring(s => {
      this.dx = s.currentValue;
    }, {
      stiffness: 1000,
      mass: 1,
      damping: 100,
      overshootClamping: true,

      fromValue: startPos,
      toValue: endPos,

      initialVelocity: currentVelocity
    });

    try {
      yield spring.start();
      this.dx = 0;
    } finally {
      spring.stop();
      this.preservedDx = this.dx;
    }
  }))
  finishTransitionTask;

  @action
  async finishTransition(targetIndex, currentVelocity = 0) {
    return this.finishTransitionTask.perform(targetIndex, currentVelocity);
  }

  @action
  onResize({ contentRect: { width }}) {
    this.paneWidth = width;
  }

  @action
  registerPane(child) {
    assert('passed child instance must be a pane', child instanceof PaneComponent);
    this.panes.push(child);
  }

  @action
  unregisterPane(child) {
    assert('passed child instance must be a pane', child instanceof PaneComponent);
    this.panes.splice(this.panes.indexOf(child), 1);
  }
}
