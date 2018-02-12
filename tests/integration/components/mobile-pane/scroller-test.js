import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';

moduleForComponent('mobile-pane/scroller', 'Integration | Component | mobile pane/scroller', {
  integration: true
});

test('it renders', function(assert) {
  // Set any properties with this.set('myProperty', 'value');
  // Handle any actions with this.on('myAction', function(val) { ... });

  this.render(hbs`{{mobile-pane/scroller}}`);

  assert.equal(this.$().text().trim(), '');

  // Template block usage:
  this.render(hbs`
    {{#mobile-pane/scroller}}
      template block text
    {{/mobile-pane/scroller}}
  `);

  assert.equal(this.$().text().trim(), 'template block text');
});
