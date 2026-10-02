import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { click, render, settled, waitUntil } from '@ember/test-helpers';
import { tracked } from '@glimmer/tracking';
import { pan } from 'ember-gesture-modifiers/test-support';
import { MobilePane } from '#src/index.js';

const SCROLLER = '.mobile-pane__scroller';

class State {
  @tracked activeIndex = 0;
  @tracked showThird = false;
  changes = [];
  dragStarts = 0;
  dragMoves = 0;
  dragEnded = false;

  onChange = (index) => {
    this.changes.push(index);
    this.activeIndex = index;
  };
  onDragStart = () => this.dragStarts++;
  onDragMove = () => this.dragMoves++;
  onDragEnd = () => {
    this.dragEnded = true;
  };
}

async function waitForDrag(state) {
  await waitUntil(() => state.dragEnded, { timeout: 3000 });
  await settled();
}

module('Integration | Component | mobile-pane', function (hooks) {
  setupRenderingTest(hooks);

  test('it renders the panes, nav and indicator', async function (assert) {
    const state = new State();
    await render(
      <template>
        <MobilePane
          @activeIndex={{state.activeIndex}}
          @onChange={{state.onChange}}
          @lazyRendering={{false}}
          as |mp|
        >
          <mp.Nav />
          <mp.Scroller as |mps|>
            <mps.Pane @title="One">Pane 1</mps.Pane>
            <mps.Pane @title="Two">Pane 2</mps.Pane>
            <mps.Pane @title="Three">Pane 3</mps.Pane>
          </mp.Scroller>
          <mp.SimpleIndicator />
        </MobilePane>
      </template>,
    );

    assert.dom('.mobile-pane').exists();
    assert.dom('.mobile-pane__pane').exists({ count: 3 });
    assert.dom('.mobile-pane__nav .nav__item').exists({ count: 3 });
    assert.dom('.mobile-pane__nav .nav__item:nth-child(1) a').hasText('One');
    assert.dom('.mobile-pane__nav .nav__item:nth-child(3) a').hasText('Three');
    assert.dom('.scroller__simple-indicator button').exists({ count: 3 });

    assert
      .dom('.mobile-pane__pane:nth-child(1)')
      .hasClass('active', 'first pane is active by default');
    assert
      .dom('.mobile-pane__nav .nav__item:nth-child(1) a')
      .hasClass('active');
    assert
      .dom(SCROLLER)
      .hasAttribute('style', /width: 300%; transform: translateX\(0%\)/);
  });

  test('@activeIndex selects the active pane', async function (assert) {
    const state = new State();
    state.activeIndex = 1;
    await render(
      <template>
        <MobilePane
          @activeIndex={{state.activeIndex}}
          @onChange={{state.onChange}}
          as |mp|
        >
          <mp.Nav />
          <mp.Scroller as |mps|>
            <mps.Pane @title="One">Pane 1</mps.Pane>
            <mps.Pane @title="Two">Pane 2</mps.Pane>
            <mps.Pane @title="Three">Pane 3</mps.Pane>
          </mp.Scroller>
        </MobilePane>
      </template>,
    );

    assert.dom('.mobile-pane__pane:nth-child(2)').hasClass('active');
    assert
      .dom('.mobile-pane__nav .nav__item:nth-child(2) a')
      .hasClass('active');
    assert.dom(SCROLLER).hasAttribute('style', /translateX\(-33\.3+\d*%\)/);

    state.activeIndex = 2;
    await settled();
    assert.dom('.mobile-pane__pane:nth-child(3)').hasClass('active');
  });

  test('clicking a nav item moves to that pane and calls @onChange', async function (assert) {
    const state = new State();
    await render(
      <template>
        <MobilePane
          @activeIndex={{state.activeIndex}}
          @onChange={{state.onChange}}
          as |mp|
        >
          <mp.Nav />
          <mp.Scroller as |mps|>
            <mps.Pane @title="One">Pane 1</mps.Pane>
            <mps.Pane @title="Two">Pane 2</mps.Pane>
            <mps.Pane @title="Three">Pane 3</mps.Pane>
          </mp.Scroller>
        </MobilePane>
      </template>,
    );

    await click('.mobile-pane__nav .nav__item:nth-child(3) a');
    await waitUntil(() => state.changes.length === 1, { timeout: 3000 });

    assert.deepEqual(state.changes, [2]);
    assert.dom('.mobile-pane__pane:nth-child(3)').hasClass('active');
    assert
      .dom('.mobile-pane__nav .nav__item:nth-child(3) a')
      .hasClass('active');
  });

  test('the nav indicator follows the active pane', async function (assert) {
    const state = new State();
    await render(
      <template>
        <MobilePane
          @activeIndex={{state.activeIndex}}
          @onChange={{state.onChange}}
          as |mp|
        >
          <mp.Nav />
          <mp.Scroller as |mps|>
            <mps.Pane @title="One">Pane 1</mps.Pane>
            <mps.Pane @title="A much longer title">Pane 2</mps.Pane>
          </mp.Scroller>
        </MobilePane>
      </template>,
    );

    const indicator = this.element.querySelector('.nav__indicator');
    const items = this.element.querySelectorAll('.nav__item');
    const scaleX = () =>
      parseFloat(indicator.style.transform.match(/scaleX\(([\d.]+)\)/)[1]);
    const width = (el) => el.getBoundingClientRect().width;
    const initial = indicator.style.transform;

    assert.ok(initial.includes('translateX'), 'indicator is positioned');
    assert.ok(
      Math.abs(scaleX() - width(items[0])) < 1,
      'indicator is as wide as the first item',
    );

    state.activeIndex = 1;
    await settled();

    assert.notStrictEqual(
      indicator.style.transform,
      initial,
      'indicator moved',
    );
    assert.ok(
      Math.abs(scaleX() - width(items[1])) < 1,
      'indicator is as wide as the second item',
    );
  });

  test('clicking a simple indicator dot moves to that pane', async function (assert) {
    const state = new State();
    await render(
      <template>
        <MobilePane
          @activeIndex={{state.activeIndex}}
          @onChange={{state.onChange}}
          as |mp|
        >
          <mp.Scroller as |mps|>
            <mps.Pane>Pane 1</mps.Pane>
            <mps.Pane>Pane 2</mps.Pane>
            <mps.Pane>Pane 3</mps.Pane>
          </mp.Scroller>
          <mp.SimpleIndicator />
        </MobilePane>
      </template>,
    );

    await click('.scroller__simple-indicator button:nth-of-type(2)');
    await waitUntil(() => state.changes.length === 1, { timeout: 3000 });

    assert.deepEqual(state.changes, [1]);
    assert.dom('.mobile-pane__pane:nth-child(2)').hasClass('active');
    assert
      .dom('.simple-indicator__indicator')
      .hasAttribute('style', /translateX\(100%\)/);
  });

  test('lazy rendering only renders the active pane and its neighbours', async function (assert) {
    const state = new State();
    await render(
      <template>
        <MobilePane
          @activeIndex={{state.activeIndex}}
          @onChange={{state.onChange}}
          as |mp|
        >
          <mp.Scroller as |mps|>
            <mps.Pane><span class="content">1</span></mps.Pane>
            <mps.Pane><span class="content">2</span></mps.Pane>
            <mps.Pane><span class="content">3</span></mps.Pane>
            <mps.Pane><span class="content">4</span></mps.Pane>
          </mp.Scroller>
        </MobilePane>
      </template>,
    );

    assert.dom('.mobile-pane__pane').exists({ count: 4 });
    assert.dom('.content').exists({ count: 2 });
    assert.dom('.mobile-pane__pane:nth-child(1) .content').exists();
    assert.dom('.mobile-pane__pane:nth-child(2) .content').exists();

    state.activeIndex = 2;
    await settled();
    assert.dom('.content').exists({ count: 3 });
    assert.dom('.mobile-pane__pane:nth-child(1) .content').doesNotExist();
    assert.dom('.mobile-pane__pane:nth-child(4) .content').exists();
  });

  test('@lazyRendering={{false}} renders all panes', async function (assert) {
    await render(
      <template>
        <MobilePane @lazyRendering={{false}} as |mp|>
          <mp.Scroller as |mps|>
            <mps.Pane><span class="content">1</span></mps.Pane>
            <mps.Pane><span class="content">2</span></mps.Pane>
            <mps.Pane><span class="content">3</span></mps.Pane>
            <mps.Pane><span class="content">4</span></mps.Pane>
          </mp.Scroller>
        </MobilePane>
      </template>,
    );

    assert.dom('.content').exists({ count: 4 });
  });

  test('strict lazy rendering only renders the visible pane', async function (assert) {
    const state = new State();
    state.activeIndex = 1;
    await render(
      <template>
        <MobilePane
          @activeIndex={{state.activeIndex}}
          @strictLazyRendering={{true}}
          as |mp|
        >
          <mp.Scroller as |mps|>
            <mps.Pane><span class="content">1</span></mps.Pane>
            <mps.Pane><span class="content">2</span></mps.Pane>
            <mps.Pane><span class="content">3</span></mps.Pane>
          </mp.Scroller>
        </MobilePane>
      </template>,
    );

    assert.dom('.content').exists({ count: 1 });
    assert.dom('.mobile-pane__pane:nth-child(2) .content').exists();
  });

  test('@keepRendered keeps panes rendered once they have been shown', async function (assert) {
    const state = new State();
    await render(
      <template>
        <MobilePane
          @activeIndex={{state.activeIndex}}
          @strictLazyRendering={{true}}
          @keepRendered={{true}}
          as |mp|
        >
          <mp.Scroller as |mps|>
            <mps.Pane><span class="content">1</span></mps.Pane>
            <mps.Pane><span class="content">2</span></mps.Pane>
            <mps.Pane><span class="content">3</span></mps.Pane>
          </mp.Scroller>
        </MobilePane>
      </template>,
    );

    assert.dom('.content').exists({ count: 1 });
    state.activeIndex = 1;
    await settled();
    state.activeIndex = 2;
    await settled();
    assert.dom('.content').exists({ count: 3 });
  });

  test('panes can be added and removed dynamically', async function (assert) {
    const state = new State();
    await render(
      <template>
        <MobilePane @lazyRendering={{false}} as |mp|>
          <mp.Nav />
          <mp.Scroller as |mps|>
            <mps.Pane @title="One">1</mps.Pane>
            <mps.Pane @title="Two">2</mps.Pane>
            {{#if state.showThird}}
              <mps.Pane @title="Three">3</mps.Pane>
            {{/if}}
          </mp.Scroller>
        </MobilePane>
      </template>,
    );

    assert.dom('.mobile-pane__nav .nav__item').exists({ count: 2 });
    assert.dom(SCROLLER).hasAttribute('style', /width: 200%/);

    state.showThird = true;
    await settled();
    assert.dom('.mobile-pane__nav .nav__item').exists({ count: 3 });
    assert.dom(SCROLLER).hasAttribute('style', /width: 300%/);

    state.showThird = false;
    await settled();
    assert.dom('.mobile-pane__nav .nav__item').exists({ count: 2 });
    assert.dom(SCROLLER).hasAttribute('style', /width: 200%/);
  });

  test('a pane rendered between existing panes keeps its DOM position', async function (assert) {
    const state = new State();
    state.activeIndex = 1;
    await render(
      <template>
        <MobilePane
          @activeIndex={{state.activeIndex}}
          @lazyRendering={{false}}
          as |mp|
        >
          <mp.Nav />
          <mp.Scroller as |mps|>
            <mps.Pane @title="One">1</mps.Pane>
            {{#if state.showThird}}
              <mps.Pane @title="Inserted">inserted</mps.Pane>
            {{/if}}
            <mps.Pane @title="Two">2</mps.Pane>
          </mp.Scroller>
        </MobilePane>
      </template>,
    );

    assert.dom('.mobile-pane__pane:nth-child(2)').hasClass('active');

    state.showThird = true;
    await settled();

    assert
      .dom('.mobile-pane__pane:nth-child(2)')
      .hasClass('active', 'the inserted pane is now the second pane');
    assert.dom('.mobile-pane__pane:nth-child(2)').hasText('inserted');
    assert
      .dom('.nav__item:nth-child(2) .item__link')
      .hasText('Inserted')
      .hasClass('active');
    assert.dom('.nav__item:nth-child(3) .item__link').hasText('Two');
  });

  test('styles are layered and can be themed with custom properties', async function (assert) {
    await render(
      <template>
        {{! template-lint-disable no-inline-styles }}
        <MobilePane
          style="--mobile-pane-active-link-color: rgb(255, 0, 0)"
          as |mp|
        >
          <mp.Nav />
          <mp.Scroller as |mps|>
            <mps.Pane @title="One">Pane 1</mps.Pane>
            <mps.Pane @title="Two">Pane 2</mps.Pane>
          </mp.Scroller>
        </MobilePane>
      </template>,
    );

    assert
      .dom('.nav__item:nth-child(1) .item__link')
      .hasStyle({ color: 'rgb(255, 0, 0)' }, 'active link uses the override');
    assert
      .dom('.nav__indicator')
      .hasStyle(
        { backgroundColor: 'rgb(255, 0, 0)' },
        'derived indicator colour follows the override',
      );
    assert
      .dom('.nav__item:nth-child(2) .item__link')
      .hasStyle({ color: 'rgb(51, 51, 51)' }, 'inactive link uses the default');
  });

  module('gestures', function () {
    test('panning left moves to the next pane', async function (assert) {
      const state = new State();
      await render(
        <template>
          <MobilePane
            @activeIndex={{state.activeIndex}}
            @onChange={{state.onChange}}
            @onDragStart={{state.onDragStart}}
            @onDragMove={{state.onDragMove}}
            @onDragEnd={{state.onDragEnd}}
            as |mp|
          >
            <mp.Scroller as |mps|>
              <mps.Pane>1</mps.Pane>
              <mps.Pane>2</mps.Pane>
              <mps.Pane>3</mps.Pane>
            </mp.Scroller>
          </MobilePane>
        </template>,
      );

      await pan(SCROLLER, 'left');
      await waitForDrag(state);

      assert.strictEqual(state.dragStarts, 1, 'onDragStart fired once');
      assert.ok(state.dragMoves > 0, 'onDragMove fired');
      assert.deepEqual(state.changes, [1]);
      assert.dom('.mobile-pane__pane:nth-child(2)').hasClass('active');
    });

    test('panning right moves to the previous pane', async function (assert) {
      const state = new State();
      state.activeIndex = 2;
      await render(
        <template>
          <MobilePane
            @activeIndex={{state.activeIndex}}
            @onChange={{state.onChange}}
            @onDragEnd={{state.onDragEnd}}
            as |mp|
          >
            <mp.Scroller as |mps|>
              <mps.Pane>1</mps.Pane>
              <mps.Pane>2</mps.Pane>
              <mps.Pane>3</mps.Pane>
            </mp.Scroller>
          </MobilePane>
        </template>,
      );

      await pan(SCROLLER, 'right');
      await waitForDrag(state);

      assert.deepEqual(state.changes, [1]);
      assert.dom('.mobile-pane__pane:nth-child(2)').hasClass('active');
    });

    test('panning past the first pane does not change the active pane', async function (assert) {
      const state = new State();
      await render(
        <template>
          <MobilePane
            @activeIndex={{state.activeIndex}}
            @onChange={{state.onChange}}
            @onDragEnd={{state.onDragEnd}}
            as |mp|
          >
            <mp.Scroller as |mps|>
              <mps.Pane>1</mps.Pane>
              <mps.Pane>2</mps.Pane>
            </mp.Scroller>
          </MobilePane>
        </template>,
      );

      await pan(SCROLLER, 'right');
      await waitForDrag(state);

      assert.deepEqual(state.changes, []);
      assert.dom('.mobile-pane__pane:nth-child(1)').hasClass('active');
      assert.dom(SCROLLER).hasAttribute('style', /translateX\(0%\)/);
    });

    test('@disabled prevents panning', async function (assert) {
      const state = new State();
      await render(
        <template>
          <MobilePane
            @disabled={{true}}
            @activeIndex={{state.activeIndex}}
            @onChange={{state.onChange}}
            @onDragStart={{state.onDragStart}}
            as |mp|
          >
            <mp.Scroller as |mps|>
              <mps.Pane>1</mps.Pane>
              <mps.Pane>2</mps.Pane>
            </mp.Scroller>
          </MobilePane>
        </template>,
      );

      await pan(SCROLLER, 'left');
      await settled();

      assert.strictEqual(state.dragStarts, 0);
      assert.deepEqual(state.changes, []);
      assert.dom('.mobile-pane__pane:nth-child(1)').hasClass('active');
    });
  });
});
