import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { action } from '@ember/object';
import { guidFor } from '@ember/object/internals';
import { once } from '@ember/runloop';
import { modifier } from 'ember-modifier';
import { hash } from '@ember/helper';
import { service } from '../-private/service.js';
import { scrollMemoryFor } from '../-private/scroll-memory.js';
import MobilePane from './mobile-pane.gjs';
import Child from './mobile-pane-infinite/child.gjs';
import './mobile-pane-infinite.css';

/**
 * @class MobilePaneInfiniteComponent
 */
export default class MobilePaneInfiniteComponent extends Component {
  @service router;

  /**
   * Remembered scroll positions, keyed by route and model.
   *
   * @private
   */
  memory;

  constructor(owner, args) {
    super(owner, args);
    this.memory = scrollMemoryFor(owner);

    // restore the initial scroll positions before the children render
    this.restoreScroll();
  }

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

  #isInserted = false;

  /**
   * The root element of the scroller.
   *
   * @private
   */
  element = null;

  /**
   * Restores the scroll positions whenever new models are received.
   */
  restoreScrollOnChange = modifier((element, [models]) => {
    this.element = element;

    // `models` is consumed here so the modifier re-runs when it changes
    if (!models) {
      return;
    }

    if (this.#isInserted) {
      // coalesce multiple model changes within one runloop into one restore
      // eslint-disable-next-line ember/no-runloop
      once(this.restoreScroll);
    } else {
      // the initial restore already happened in the constructor
      this.#isInserted = true;
    }
  });

  get activeIndex() {
    return this.args.previousModel ? 1 : 0;
  }

  get models() {
    return [
      this.args.previousModel,
      this.args.currentModel,
      this.args.nextModel,
    ].filter(Boolean);
  }

  @action
  onDragStart() {
    // The previous/next children are clipped to the viewport height at the
    // top of the scroller. Shift them down by however far the scroller's top
    // is scrolled out of view, so they line up with the visible part of the
    // current child. That is the document scroll only if the scroller starts
    // at the very top of the page.
    const top = this.element?.getBoundingClientRect().top ?? 0;
    this.childOffsetTop = Math.max(0, -top);

    if (this.args.onDragStart) {
      this.args.onDragStart(...arguments);
    }
  }

  @action
  onDragMove() {
    if (this.args.onDragMove) {
      this.args.onDragMove(...arguments);
    }
  }

  @action
  onDragEnd(targetIndex) {
    // transition to previous or next model
    const targetModel = this.models[targetIndex];
    if (targetModel !== this.args.currentModel) {
      // store the scroll position of currentModel
      this.storeScroll();
    }

    if (this.args.onDragEnd) {
      this.args.onDragEnd(targetIndex, targetModel);
    }
  }

  @action
  onChange(index) {
    this.args.onChange?.(this.models[index], index);
  }

  storeScroll() {
    const key = this._buildMemoryKey(this.args.currentModel);
    this.memory.set(
      key,
      document.scrollingElement.scrollTop || document.documentElement.scrollTop,
    );
  }

  //TODO: purge scroll states if we came from a higher level route
  //TODO: make this function more robust & optional
  @action
  restoreScroll() {
    const prevKey = this._buildMemoryKey(this.args.previousModel);
    const currentKey = this._buildMemoryKey(this.args.currentModel);
    const nextKey = this._buildMemoryKey(this.args.nextModel);

    this.prevChildScroll = this.memory.get(prevKey) || 0;
    this.currentChildScroll = this.memory.get(currentKey) || 0;
    this.nextChildScroll = this.memory.get(nextKey) || 0;
  }

  // utils
  _buildMemoryKey(model) {
    return `mobile-pane/${this.router.currentRouteName}.${guidFor(model)}`;
  }

  <template>
    <MobilePane
      ...attributes
      @disabled={{@disabled}}
      @activeIndex={{this.activeIndex}}
      @triggerVelocity={{@triggerVelocity}}
      @transitionDuration={{@transitionDuration}}
      @lazyRendering={{@lazyRendering}}
      @strictLazyRendering={{@strictLazyRendering}}
      @strictLazyRenderingDeadZone={{@strictLazyRenderingDeadZone}}
      @keepRendered={{@keepRendered}}
      @onDragStart={{this.onDragStart}}
      @onDragMove={{this.onDragMove}}
      @onDragEnd={{this.onDragEnd}}
      @onChange={{this.onChange}}
      class="mobile-pane__infinite-scroller"
      {{this.restoreScrollOnChange this.models}}
      as |mp|
    >
      <mp.Scroller as |mps|>
        {{#if @previousModel}}
          <mps.Pane>
            <Child
              class="mobile-pane__child--previous"
              @offsetTop={{this.childOffsetTop}}
              @scroll={{this.prevChildScroll}}
            >
              {{~yield (hash model=@previousModel isCurrentModel=false)~}}
            </Child>
          </mps.Pane>
        {{/if}}

        <mps.Pane>
          <Child
            class="mobile-pane__child--current"
            @scroll={{this.currentChildScroll}}
            @setAsDocumentScroll={{true}}
          >
            {{~yield (hash model=@currentModel isCurrentModel=true)~}}
          </Child>
        </mps.Pane>

        {{#if @nextModel}}
          <mps.Pane>
            <Child
              class="mobile-pane__child--next"
              @offsetTop={{this.childOffsetTop}}
              @scroll={{this.nextChildScroll}}
            >
              {{~yield (hash model=@nextModel isCurrentModel=false)~}}
            </Child>
          </mps.Pane>
        {{/if}}
      </mp.Scroller>
    </MobilePane>
  </template>
}
