import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render, settled, waitUntil } from '@ember/test-helpers';
import { tracked } from '@glimmer/tracking';
import { pan } from 'ember-gesture-modifiers/test-support';
import { MobilePaneInfinite } from '#src/index.js';

const SCROLLER = '.mobile-pane__scroller';
const MODELS = ['a', 'b', 'c', 'd'];

class State {
  @tracked previousModel;
  @tracked currentModel;
  @tracked nextModel;
  changes = [];

  constructor(model) {
    this.setModel(model);
  }

  setModel(model) {
    const index = MODELS.indexOf(model);
    this.previousModel = MODELS[index - 1];
    this.currentModel = MODELS[index];
    this.nextModel = MODELS[index + 1];
  }

  onChange = (model, index) => {
    this.changes.push([model, index]);
    this.setModel(model);
  };
}

module('Integration | Component | mobile-pane-infinite', function (hooks) {
  setupRenderingTest(hooks);

  test('it renders the previous, current and next models', async function (assert) {
    const state = new State('b');
    await render(
      <template>
        <MobilePaneInfinite
          @previousModel={{state.previousModel}}
          @currentModel={{state.currentModel}}
          @nextModel={{state.nextModel}}
          @onChange={{state.onChange}}
          as |mpi|
        >
          <span class="model {{if mpi.isCurrentModel 'current'}}">
            {{mpi.model}}
          </span>
        </MobilePaneInfinite>
      </template>,
    );

    assert.dom('.mobile-pane__pane').exists({ count: 3 });
    assert.dom('.mobile-pane__child--previous').hasText('a');
    assert.dom('.mobile-pane__child--current').hasText('b');
    assert.dom('.mobile-pane__child--next').hasText('c');
    assert.dom('.model.current').hasText('b');
    assert.dom('.mobile-pane__pane:nth-child(2)').hasClass('active');
  });

  test('it omits the previous pane for the first model', async function (assert) {
    const state = new State('a');
    await render(
      <template>
        <MobilePaneInfinite
          @previousModel={{state.previousModel}}
          @currentModel={{state.currentModel}}
          @nextModel={{state.nextModel}}
          as |mpi|
        >
          {{mpi.model}}
        </MobilePaneInfinite>
      </template>,
    );

    assert.dom('.mobile-pane__pane').exists({ count: 2 });
    assert.dom('.mobile-pane__child--previous').doesNotExist();
    assert.dom('.mobile-pane__child--current').hasText('a');
    assert.dom('.mobile-pane__pane:nth-child(1)').hasClass('active');
  });

  test('panning to the next pane calls @onChange with the next model', async function (assert) {
    const state = new State('b');
    await render(
      <template>
        <MobilePaneInfinite
          @previousModel={{state.previousModel}}
          @currentModel={{state.currentModel}}
          @nextModel={{state.nextModel}}
          @onChange={{state.onChange}}
          as |mpi|
        >
          {{mpi.model}}
        </MobilePaneInfinite>
      </template>,
    );

    await pan(SCROLLER, 'left');
    await waitUntil(() => state.changes.length === 1, { timeout: 3000 });
    await settled();

    assert.deepEqual(state.changes, [['c', 2]]);
    assert.dom('.mobile-pane__child--current').hasText('c');
    assert.dom('.mobile-pane__child--previous').hasText('b');
    assert.dom('.mobile-pane__child--next').hasText('d');
  });
});
