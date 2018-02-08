import Component from '@ember/component';
import layout from '../templates/components/mobile-pane';

import { computed, get, set } from '@ember/object';

import Pane from 'ember-mobile-pane/components/mobile-pane/pane';
import ComponentParentMixin from 'ember-mobile-pane/mixins/component-parent';

import { htmlSafe } from '@ember/string';
import { next } from '@ember/runloop';

export default Component.extend(ComponentParentMixin, {
  layout,

  classNames: ['mobile-pane'],
  classNameBindings: ['isDragging:mobile-pane--dragging', 'transitionsEnabled:mobile-pane--transitions'],

  init(){
    this._super(...arguments);

    next(() => {
      // delay transitions effects until the pane has fully initialized
      set(this, 'transitionsEnabled', true);
    });
  },

  // public
  triggerVelocity: 0.25,

  /**
   * Renders active pane and it's nearest neighbours
   */
  lazyRendering: true,

  /**
   * Renders panes only when they are in the current viewport
   */
  strictLazyRendering: false,

  /**
   * Deadzone for how far a pane must be in the viewport to be rendered
   */
  strictLazyRenderingDeadZone: 0.25,

  // fired whenever the active pane changes
  onChange(){},

  actions: {
    changePane(element){
      set(this, 'activeIndex', element.index);
    },

    onDragStart(){
      set(this, 'isDragging', true);
    },
    onDragMove(dx){
      set(this, 'dx', dx);
    },
    onDragEnd(activeIndex){
      set(this, 'isDragging', false);
      set(this, 'activeIndex', activeIndex);
      set(this, 'dx', 0);
    }
  },

  // private
  transitionsEnabled: false,
  isDragging: false,
  dx: 0,

  _lazyRendering: computed.or('lazyRendering', 'strictLazyRendering'),

  paneContainerElement: computed.readOnly('element'),
  panes: computed.filter('children', function(view) {
    return view instanceof Pane;
  }),
  paneCount: computed('panes.[]', function(){
    return get(this, 'panes').length;
  }),

  navItems: computed('panes.@each.{elementId,title}', function(){
    return get(this, 'panes').map((item, index) => {
      const result = item.getProperties('elementId', 'title');
      result.index = index;
      return result;
    });
  }),

  _activeIndex: 0,
  activeIndex: computed({
    get(){
      return get(this, '_activeIndex');
    },
    set(key, value){
      set(this, '_activeIndex', value);

      get(this, 'onChange')(value);

      return value;
    }
  }),
  activePane: computed('panes.@each.elementId', 'activeIndex', function(){
    return get(this, 'panes').objectAt(get(this, 'activeIndex'));
  }),

  /**
   * Returns the panes which should be rendered when lazy rendering is enabled.
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

  currentOffset: computed('activeIndex', 'dx', 'isDragging', 'paneCount', function(){
    const dx = get(this, 'isDragging')
      ? get(this, 'dx')
      : 0;

    // don't divide by 0
    return get(this, 'paneCount') !== 0
      ? get(this, 'activeIndex') * -100 / get(this, 'paneCount') + dx
      : dx;
  }),
  navOffset: computed('currentOffset', 'paneCount', function(){
    return Math.min(Math.max(get(this, 'currentOffset') * get(this, 'paneCount') / -100, 0), get(this, 'paneCount') - 1);
  })
});
