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

module(
  'Integration | Component | mobile-pane-infinite | offset',
  function (hooks) {
    setupRenderingTest(hooks);

    let spacer;
    hooks.beforeEach(function () {
      // make the document itself scrollable
      spacer = document.createElement('div');
      spacer.style.height = '5000px';
      document.body.appendChild(spacer);
    });

    hooks.afterEach(function () {
      window.scrollTo(0, 0);
      spacer.remove();
    });

    async function dragAndMeasure(state, scroll) {
      let transform;
      // measure on every move, the last one sees the rendered drag state
      const onDragMove = () => {
        transform = document.querySelector('.mobile-pane__child--next').style
          .transform;
      };

      await render(
        <template>
          {{! template-lint-disable no-inline-styles }}
          <div style="height: 4000px">
            <MobilePaneInfinite
              @previousModel={{state.previousModel}}
              @currentModel={{state.currentModel}}
              @nextModel={{state.nextModel}}
              @onChange={{state.onChange}}
              @onDragMove={{onDragMove}}
              as |mpi|
            >
              {{mpi.model}}
            </MobilePaneInfinite>
          </div>
        </template>,
      );

      const scroller = document.querySelector(
        '.mobile-pane__infinite-scroller',
      );
      scroll(scroller.getBoundingClientRect().top);
      const top = scroller.getBoundingClientRect().top;

      await pan(SCROLLER, 'left');
      await waitUntil(() => state.changes.length === 1, { timeout: 3000 });
      await settled();

      const shift = transform
        ? parseFloat(transform.match(/translateY\((-?[\d.]+)px\)/)[1])
        : 0;
      return { top, shift };
    }

    test('neighbours are not shifted while the scroller top is in view', async function (assert) {
      const state = new State('b');
      // scroll the document; the testing container is position: fixed, so the
      // scroller's top stays in view
      const { top, shift } = await dragAndMeasure(state, () =>
        window.scrollTo(0, 500),
      );

      assert.ok(window.scrollY > 0, 'the document is scrolled');
      assert.ok(top >= 0, 'the scroller top is in view');
      assert.strictEqual(shift, 0, 'neighbours are not shifted');
    });

    test('neighbours line up with the visible part when the scroller top is scrolled out of view', async function (assert) {
      const state = new State('b');
      // scroll the testing container so the scroller's top ends up above the
      // viewport
      const { top, shift } = await dragAndMeasure(state, () => {
        const container = document.querySelector('#ember-testing-container');
        container.scrollTop = container.scrollHeight;
      });

      assert.ok(top < 0, 'the scroller top is out of view');
      assert.ok(
        Math.abs(shift + top) < 1,
        `neighbours are shifted by ${-top}px (got ${shift}px)`,
      );
    });

    test('remembered scroll positions are relative to the scroller, not the page', async function (assert) {
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

      // scroll the document; the scroller's top stays in view (the testing
      // container is position: fixed), so nothing is scrolled *within* it
      window.scrollTo(0, 500);

      // go to the first model (the previous pane disappears) and back (it is
      // rendered again, with the remembered scroll of 'a')
      await pan(SCROLLER, 'right');
      await waitUntil(() => state.changes.length === 1, { timeout: 3000 });
      await settled();
      await pan(SCROLLER, 'left');
      await waitUntil(() => state.changes.length === 2, { timeout: 3000 });
      await settled();

      assert.deepEqual(state.changes, [
        ['a', 0],
        ['b', 1],
      ]);
      assert.dom('.mobile-pane__child--previous').hasText('a');
      const inner = document.querySelector(
        '.mobile-pane__child--previous .mobile-pane__child-transformable',
      );
      const { transform } = getComputedStyle(inner);
      const shift = transform === 'none' ? 0 : new DOMMatrix(transform).m42;
      assert.strictEqual(
        shift,
        0,
        'the re-rendered previous pane is not shifted out of view',
      );
    });
  },
);
