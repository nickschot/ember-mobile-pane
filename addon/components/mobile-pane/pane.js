import Component from '@ember/component';
import layout from '../../templates/components/mobile-pane/pane';

import ComponentChildMixin from 'ember-mobile-pane/mixins/component-child';

export default Component.extend(ComponentChildMixin, {
  layout,

  classNames: ['mobile-pane__pane'],

  title: null
});
