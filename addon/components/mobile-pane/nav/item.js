import Component from '@ember/component';
import layout from '../../../templates/components/mobile-pane/nav/item';

import ComponentChildMixin from 'ember-mobile-pane/mixins/component-child';
import { get, computed } from '@ember/object';

export default Component.extend(ComponentChildMixin, {
  layout,
  tagName: 'li',
  classNames: ['nav__item'],

  onClick(){},

  isActive: computed('navItem.elementId', 'activePane.elementId', function(){
    return get(this, 'navItem.elementId') === get(this, 'activePane.elementId');
  }),

  actions: {
    clickItem(){
      // TODO: check if this is the proper fix
      get(this, 'onClick')(get(this, 'navItem.index'));
    }
  }
});
