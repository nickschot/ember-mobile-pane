import Component from '@ember/component';
import layout from '../../templates/components/mobile-pane/pane';

import ComponentChildMixin from 'ember-mobile-pane/mixins/component-child';
import { computed, get, set } from '@ember/object';

export default Component.extend(ComponentChildMixin, {
  layout,

  classNames: ['mobile-pane__pane'],
  classNameBindings: ['isActive:active'],

  // public
  title: null,

  // protected
  activePane: null,
  lazyRendering: true,
  keepRendered: false,
  paneCount: 0,
  visiblePanes: null,

  // private
  didRender: false,

  isActive: computed('activePane', function(){
    return this === get(this, 'activePane');
  }),

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
          set(this, 'didRender', true);
        }

        return willRender;
      } else {
        return true;
      }
    }
  )
});
