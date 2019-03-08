import Component from '@ember/component';
import layout from '../../templates/components/mobile-pane/pane';

import ComponentChildMixin from 'ember-mobile-pane/mixins/component-child';
import { computed, get, set } from '@ember/object';

/**
 * @class PaneComponent
 */
export default Component.extend(ComponentChildMixin, {
  layout,

  classNames: ['mobile-pane__pane'],
  classNameBindings: ['isActive:active'],

  // public

  /**
   * Title of the pane. Used in the NavComponent  if it's present.
   *
   * @argument title
   * @type ''
   * @default null
   */
  title: null,

  // protected
  activePane: null,
  lazyRendering: true,
  keepRendered: false,
  paneCount: 0,
  visiblePanes: null,

  /**
   * Whether or not the pane was rendered before. Used for lazyRendering.
   *
   * @property didRender
   * @private
   */
  didRender: false,

  /**
   * True if this pane is the active pane.
   *
   * @property isActive
   * @private
   */
  isActive: computed('activePane', function(){
    return this === get(this, 'activePane');
  }),

  //TODO: refactor with ember-concurrency to solve the side effect issue (?)
  renderContent: computed(
    'lazyRendering',
    'keepRendered',
    'didRender',
    'visiblePanes.@each.{elementId}',
    'elementId',
    function(){
      if(get(this, 'lazyRendering') && !(get(this, 'keepRendered') && get(this, 'didRender'))){
        const willRender = !!get(this, 'visiblePanes')
          .find(item => get(item, 'elementId') === get(this, 'elementId'));

        if(willRender){
          // eslint-disable-next-line ember/no-side-effects
          set(this, 'didRender', true);
        }

        return willRender;
      } else {
        return true;
      }
    }
  )
});
