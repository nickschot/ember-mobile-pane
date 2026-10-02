import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { assert } from '@ember/debug';
import { registerDestructor } from '@ember/destroyable';
import { hash } from '@ember/helper';
import PaneComponent from './mobile-pane/pane.gjs';
import NavComponent from './mobile-pane/nav.gjs';
import ScrollerComponent from './mobile-pane/scroller.gjs';
import SimpleIndicatorComponent from './mobile-pane/simple-indicator.gjs';
import Spring from '../-private/spring.js';
import { onResize } from '../-private/on-resize.js';
import { insertInDomOrder } from '../-private/dom-order.js';
import './mobile-pane.css';

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
    return this.args.transitionDuration ?? 300;
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
  /**
   * The registered panes. Always replaced, never mutated.
   *
   * Registration happens from a modifier, so we must not read the tracked
   * `panes` while updating it (that would trip Ember's "updated a value after
   * using it in the same computation" assertion). `#panes` is an untracked
   * mirror used for the update itself.
   */
  @tracked panes = [];
  #panes = [];

  /**
   * The spring of the currently running finish transition, if any.
   *
   * @private
   */
  #activeSpring = null;

  constructor(owner, args) {
    super(owner, args);
    registerDestructor(this, () => this.cancelTransition());
  }

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
      index,
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

  get procentualOffset() {
    // don't divide by 0
    return this.paneCount !== 0
      ? (this.activeIndex * -100) / this.paneCount + this.dx
      : this.dx;
  }

  get relativeOffset() {
    return Math.min(
      Math.max((this.procentualOffset * this.paneCount) / -100, 0),
      this.paneCount - 1,
    );
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

    if (this.strictLazyRendering) {
      const lazyOffset = this.relativeOffset - activeIndex;

      if (Math.abs(lazyOffset) > this.strictLazyRenderingDeadZone) {
        const visibleNeighborIndex =
          lazyOffset > 0
            ? Math.ceil(this.relativeOffset)
            : Math.floor(this.relativeOffset);

        visibleIndices.push(visibleNeighborIndex);
      }
    } else {
      visibleIndices.push(activeIndex - 1, activeIndex + 1);
    }

    return this.panes
      .filter((item, index) => visibleIndices.includes(index))
      .map((item) => ({ elementId: item.elementId }));
  }

  @action
  onDragStart() {
    this.isDragging = true;
    this.cancelTransition();

    if (this.args.onDragStart) {
      this.args.onDragStart();
    }
  }

  @action
  onDragMove(dx) {
    this.dx = dx + this.preservedDx;

    if (this.args.onDragMove) {
      this.args.onDragMove(dx);
    }
  }

  @action
  async onDragEnd(activeIndex, finishTransition = false) {
    if (finishTransition) {
      const completed = await this.finishTransition(activeIndex);

      if (!completed) {
        // a new drag (or transition) took over, it will handle the rest
        return;
      }
    }

    this.isDragging = false;
    this.dx = 0;

    if (this.args.onDragEnd) {
      this.args.onDragEnd(activeIndex);
    }

    if (activeIndex !== this.activeIndex && this.args.onChange) {
      this.args.onChange(activeIndex);
    }
  }

  @action
  async moveToPane(index) {
    const completed = await this.finishTransition(index);

    if (completed) {
      this.args.onChange?.(index);
    }
  }

  /**
   * Stops a running finish transition, keeping the current offset.
   *
   * @private
   */
  cancelTransition() {
    const spring = this.#activeSpring;

    if (spring) {
      this.#activeSpring = null;
      this.preservedDx = this.dx;
      spring.stop();
    }
  }

  /**
   * Animates to the given pane. Resolves to `true` when the transition
   * completed and to `false` when it was cancelled.
   *
   * @private
   */
  @action
  async finishTransition(targetIndex, currentVelocity = 0) {
    this.cancelTransition();

    const startPos = this.dx;
    const endPos = (targetIndex - this.activeIndex) * (-100 / this.paneCount);

    const spring = new Spring(
      (s) => {
        this.dx = s.currentValue;
      },
      {
        stiffness: 1000,
        mass: 1,
        damping: 100,
        overshootClamping: true,

        fromValue: startPos,
        toValue: endPos,

        initialVelocity: currentVelocity,
      },
    );

    this.#activeSpring = spring;
    await spring.start();

    if (this.#activeSpring !== spring) {
      return false;
    }

    this.#activeSpring = null;
    this.dx = 0;
    this.preservedDx = 0;

    return true;
  }

  @action
  handleResize({ contentRect: { width } }) {
    this.paneWidth = width;
  }

  @action
  registerPane(child) {
    assert(
      'passed child instance must be a pane',
      child instanceof PaneComponent,
    );
    this.panes = this.#panes = insertInDomOrder(this.#panes, child);
  }

  @action
  unregisterPane(child) {
    assert(
      'passed child instance must be a pane',
      child instanceof PaneComponent,
    );
    this.panes = this.#panes = this.#panes.filter((pane) => pane !== child);
  }

  <template>
    <div
      ...attributes
      class="mobile-pane {{if this.isDragging 'mobile-pane--dragging'}}"
      {{onResize this.handleResize}}
    >
      {{yield
        (hash
          Nav=(component
            NavComponent
            activeIndex=this.activeIndex
            transitionDuration=this.transitionDuration
            activePane=this.activePane
            navItems=this.navItems
            relativeOffset=this.relativeOffset
            onItemClick=this.moveToPane
          )
          SimpleIndicator=(component
            SimpleIndicatorComponent
            navItems=this.navItems
            offset=this.relativeOffset
            onClick=this.moveToPane
          )
          Scroller=(component
            ScrollerComponent
            disabled=this.disabled
            activeIndex=this.activeIndex
            lazyRendering=this._lazyRendering
            keepRendered=this.keepRendered
            transitionDuration=this.transitionDuration
            triggerVelocity=this.triggerVelocity
            activePane=this.activePane
            paneWidth=this.paneWidth
            paneCount=this.paneCount
            relativeOffset=this.relativeOffset
            procentualOffset=this.procentualOffset
            visiblePanes=this.visiblePanes
            onDragStart=this.onDragStart
            onDragMove=this.onDragMove
            onDragEnd=this.onDragEnd
            registerPane=this.registerPane
            unregisterPane=this.unregisterPane
          )
        )
      }}
    </div>
  </template>
}
