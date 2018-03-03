import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';

moduleForComponent('mobile-pane/infinite-scroller/child', 'Integration | Component | mobile pane/infinite scroller/child', {
  integration: true
});

test('it renders', function(assert) {
  // Set any properties with this.set('myProperty', 'value');
  // Handle any actions with this.on('myAction', function(val) { ... });

  this.render(hbs`{{mobile-pane/infinite-scroller/child}}`);

  assert.equal(this.$().text().trim(), '');

  // Template block usage:
  this.render(hbs`
    {{#mobile-pane/infinite-scroller/child}}
      template block text
    {{/mobile-pane/infinite-scroller/child}}
  `);

  assert.equal(this.$().text().trim(), 'template block text');
});
