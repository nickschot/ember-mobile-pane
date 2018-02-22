import Component from '@ember/component';
import layout from '../../../templates/components/mobile-pane/nav/item';

import ComponentChildMixin from 'ember-mobile-pane/mixins/component-child';
import { get } from '@ember/object';

export default Component.extend(ComponentChildMixin, {
  layout,
  tagName: 'li',
  classNames: ['nav__item'],

  onClick(){},

  actions: {
    clickItem(){
      get(this, 'onClick')(get(this, 'navItem'));
    }
  }
});
