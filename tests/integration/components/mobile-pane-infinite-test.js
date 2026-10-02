import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render, settled, waitUntil } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import { pan } from 'ember-gesture-modifiers/test-support';

const SCROLLER = '.mobile-pane__scroller';

module('Integration | Component | mobile-pane-infinite', function (hooks) {
  setupRenderingTest(hooks);

  hooks.beforeEach(function () {
    const models = ['a', 'b', 'c', 'd'];
    this.changes = [];
    this.setModel = (model) => {
      const index = models.indexOf(model);
      this.set('previousModel', models[index - 1]);
      this.set('currentModel', models[index]);
      this.set('nextModel', models[index + 1]);
    };
    this.onChange = (model, index) => {
      this.changes.push([model, index]);
      this.setModel(model);
    };
  });

  test('it renders the previous, current and next models', async function (assert) {
    this.setModel('b');
    await render(hbs`
      <MobilePaneInfinite
        @previousModel={{this.previousModel}}
        @currentModel={{this.currentModel}}
        @nextModel={{this.nextModel}}
        @onChange={{this.onChange}}
      as |mpi|>
        <span class="model {{if mpi.isCurrentModel "current"}}">{{mpi.model}}</span>
      </MobilePaneInfinite>
    `);

    assert.dom('.mobile-pane__pane').exists({ count: 3 });
    assert.dom('.mobile-pane__child--previous').hasText('a');
    assert.dom('.mobile-pane__child--current').hasText('b');
    assert.dom('.mobile-pane__child--next').hasText('c');
    assert.dom('.model.current').hasText('b');
    assert.dom('.mobile-pane__pane:nth-child(2)').hasClass('active');
  });

  test('it omits the previous pane for the first model', async function (assert) {
    this.setModel('a');
    await render(hbs`
      <MobilePaneInfinite
        @previousModel={{this.previousModel}}
        @currentModel={{this.currentModel}}
        @nextModel={{this.nextModel}}
      as |mpi|>
        {{mpi.model}}
      </MobilePaneInfinite>
    `);

    assert.dom('.mobile-pane__pane').exists({ count: 2 });
    assert.dom('.mobile-pane__child--previous').doesNotExist();
    assert.dom('.mobile-pane__child--current').hasText('a');
    assert.dom('.mobile-pane__pane:nth-child(1)').hasClass('active');
  });

  test('panning to the next pane calls @onChange with the next model', async function (assert) {
    this.setModel('b');
    await render(hbs`
      <MobilePaneInfinite
        @previousModel={{this.previousModel}}
        @currentModel={{this.currentModel}}
        @nextModel={{this.nextModel}}
        @onChange={{this.onChange}}
      as |mpi|>
        {{mpi.model}}
      </MobilePaneInfinite>
    `);

    await pan(SCROLLER, 'left');
    await waitUntil(() => this.changes.length === 1, { timeout: 3000 });
    await settled();

    assert.deepEqual(this.changes, [['c', 2]]);
    assert.dom('.mobile-pane__child--current').hasText('c');
    assert.dom('.mobile-pane__child--previous').hasText('b');
    assert.dom('.mobile-pane__child--next').hasText('d');
  });
});
