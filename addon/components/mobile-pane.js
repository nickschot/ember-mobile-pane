import Component from '@ember/component';
import layout from '../templates/components/mobile-pane';

import { computed, get, set } from '@ember/object';

import PaneComponent from 'ember-mobile-pane/components/mobile-pane/pane';
import ComponentParentMixin from 'ember-mobile-pane/mixins/component-parent';

//TODO: delay (normal) lazyRendering until after the animation has completed to prevent stutter

/**
 * @class MobilePaneComponent
 * @public
 */
export default Component.extend(ComponentParentMixin, {
  layout,

  classNames: ['mobile-pane'],
  classNameBindings: [
    'isDragging:mobile-pane--dragging',
  ],

  init(){
    this._super(...arguments);
  },

  // public

  /**
   * Index of the active pane.
   *
   * @argument activeIndex
   * @type {Number} Must be an integer
   * @default 0
   */
  activeIndex: 0,

  /**
   * Velocity necessary to trigger a "swipe".
   *
   * @argument triggerVelocity
   * @type {Number}
   * @default 0.3
   */
  triggerVelocity: 0.3,

  /**
   * Duration of the finish animation in ms.
   *
   * @argument transitionDuration
   * @type {Number}
   * @default 300
   */
  transitionDuration: 300,

  /**
   * Renders the active pane and it's direct neighbours.
   *
   * @argument lazyRendering
   * @type {Boolean}
   * @default true
   */
  lazyRendering: true,

  /**
   * Renders panes only when they are in the current viewport.
   *
   * @argument strictLazyRendering
   * @type {Boolean}
   * @default false
   */
  strictLazyRendering: false,

  /**
   * Deadzone for how far a pane must be in the viewport to be rendered
   *
   * @argument strictLazyRenderingDeadZone
   * @type {Number} between 0 and 1.0
   * @default 0
   */
  strictLazyRenderingDeadZone: 0,

  /**
   * Keep the pane content rendered after the initial render
   *
   * @argument keepRendered
   * @type {Boolean}
   * @default false
   */
  keepRendered: false,

  /**
   * Hook fired when the active pane changed.
   *
   * @argument onChange
   * @type {Function}
   * @default function(activeIndex){}
   */
  onChange(activeIndex){}, //eslint-disable-line no-unused-vars

  onDragStart(){},
  onDragMove(dx){}, //eslint-disable-line no-unused-vars
  onDragEnd(activeIndex){}, //eslint-disable-line no-unused-vars

  actions: {
    onDragStart(){
      set(this, 'isDragging', true);

      this.get('onDragStart')();
    },
    onDragMove(dx){
      set(this, 'dx', dx);

      this.get('onDragMove')(dx);
    },
    onDragEnd(activeIndex){
      set(this, 'isDragging', false);
      set(this, 'dx', 0);

      this.get('onDragEnd')(activeIndex);

      if(activeIndex !== this.get('activeIndex')){
        this.get('onChange')(activeIndex);
      }
    }
  },

  /**
   * True if the user is dragging in the pane.
   *
   * @property isDragging
   * @type {Boolean}
   * @default false
   * @private
   */
  isDragging: false,

  /**
   * Current offset in px.
   *
   * @property dx
   * @type {Number}
   * @default 0
   * @private
   */
  dx: 0,

  /**
   * True if lazy rendering is enabled.
   *
   * @property _lazyRendering
   * @private
   */
  _lazyRendering: computed.or('lazyRendering', 'strictLazyRendering'),

  paneContainerElement: computed.readOnly('element'),
  panes: computed.filter('children', function(view) {
    return view instanceof PaneComponent;
  }),
  paneCount: computed('panes.length', function(){
    return get(this, 'panes.length');
  }),

  navItems: computed('panes.@each.{elementId,title}', function(){
    return get(this, 'panes').map((item, index) => {
      const result = item.getProperties('elementId', 'title');
      result.index = index;
      return result;
    });
  }),

  /**
   * Returns the active pane.
   *
   * @property activePane
   * @type {PaneComponent}
   * @private
   */
  activePane: computed('panes.@each.elementId', 'activeIndex', function(){
    return get(this, 'panes').objectAt(get(this, 'activeIndex'));
  }),

  /**
   * Returns the panes which should be rendered when lazy rendering is enabled.
   *
   * @property visiblePanes
   * @private
   */
  visiblePanes: computed('panes.@each.elementId', 'activeIndex', 'navOffset', function(){
    const activeIndex = get(this, 'activeIndex');
    const visibleIndices = [activeIndex];

    if(get(this, 'strictLazyRendering')){
      const navOffset = get(this, 'navOffset');
      const lazyOffset = navOffset - activeIndex;

      if(Math.abs(lazyOffset) > get(this, 'strictLazyRenderingDeadZone')){
        const visibleNeighborIndex = lazyOffset > 0
          ? Math.ceil(navOffset)
          : Math.floor(navOffset);

        visibleIndices.push(visibleNeighborIndex);
      }
    } else {
      visibleIndices.push(activeIndex-1, activeIndex+1);
    }

    return get(this, 'panes')
      .filter((item, index) => visibleIndices.includes(index))
      .map(item => item.getProperties('elementId'));
  }),

  currentOffset: computed('activeIndex', 'dx', 'paneCount', function(){
    // don't divide by 0
    return get(this, 'paneCount') !== 0
      ? get(this, 'activeIndex') * -100 / get(this, 'paneCount') + get(this, 'dx')
      : get(this, 'dx');
  }),

  //TODO: rename to something more akin of what the number represents (limitedOffset, boundedOffset)
  navOffset: computed('currentOffset', 'paneCount', function(){
    return Math.min(Math.max(get(this, 'currentOffset') * get(this, 'paneCount') / -100, 0), get(this, 'paneCount') - 1);
  })
});
