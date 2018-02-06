import Component from '@ember/component';
import layout from '../../templates/components/mobile-pane/pane';

import ComponentChildMixin from 'ember-mobile-pane/mixins/component-child';
import { computed, get } from '@ember/object';

export default Component.extend(ComponentChildMixin, {
  layout,

  classNames: ['mobile-pane__pane'],

  title: null,
  renderContent: computed(
    'visiblePanes.@each.{elementId}',
    'elementId',
    function(){
      if(get(this, 'lazyRendering')){
        return !!get(this, 'visiblePanes')
          .find(item => get(item, 'elementId') === get(this, 'elementId'));
      } else {
        return true;
      }
    }
  )
});
