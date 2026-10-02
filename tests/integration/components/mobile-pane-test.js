import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { click, render, settled, waitUntil } from '@ember/test-helpers';
import { hbs } from 'ember-cli-htmlbars';
import { pan } from 'ember-gesture-modifiers/test-support';

const SCROLLER = '.mobile-pane__scroller';

async function waitForDrag(ctx) {
  await waitUntil(() => ctx.dragEnded, { timeout: 3000 });
  await settled();
}

module('Integration | Component | mobile-pane', function (hooks) {
  setupRenderingTest(hooks);

  hooks.beforeEach(function () {
    this.activeIndex = 0;
    this.changes = [];
    this.dragEnded = false;
    this.onChange = (index) => {
      this.changes.push(index);
      this.set('activeIndex', index);
    };
    this.onDragEnd = () => {
      this.dragEnded = true;
    };
  });

  test('it renders the panes, nav and indicator', async function (assert) {
    await render(hbs`
      <MobilePane @activeIndex={{this.activeIndex}} @onChange={{this.onChange}} @lazyRendering={{false}} as |mp|>
        <mp.Nav />
        <mp.Scroller as |mps|>
          <mps.Pane @title="One">Pane 1</mps.Pane>
          <mps.Pane @title="Two">Pane 2</mps.Pane>
          <mps.Pane @title="Three">Pane 3</mps.Pane>
        </mp.Scroller>
        <mp.SimpleIndicator />
      </MobilePane>
    `);

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
    this.activeIndex = 1;
    await render(hbs`
      <MobilePane @activeIndex={{this.activeIndex}} @onChange={{this.onChange}} as |mp|>
        <mp.Nav />
        <mp.Scroller as |mps|>
          <mps.Pane @title="One">Pane 1</mps.Pane>
          <mps.Pane @title="Two">Pane 2</mps.Pane>
          <mps.Pane @title="Three">Pane 3</mps.Pane>
        </mp.Scroller>
      </MobilePane>
    `);

    assert.dom('.mobile-pane__pane:nth-child(2)').hasClass('active');
    assert
      .dom('.mobile-pane__nav .nav__item:nth-child(2) a')
      .hasClass('active');
    assert.dom(SCROLLER).hasAttribute('style', /translateX\(-33\.3+\d*%\)/);

    this.set('activeIndex', 2);
    assert.dom('.mobile-pane__pane:nth-child(3)').hasClass('active');
  });

  test('clicking a nav item moves to that pane and calls @onChange', async function (assert) {
    await render(hbs`
      <MobilePane @activeIndex={{this.activeIndex}} @onChange={{this.onChange}} as |mp|>
        <mp.Nav />
        <mp.Scroller as |mps|>
          <mps.Pane @title="One">Pane 1</mps.Pane>
          <mps.Pane @title="Two">Pane 2</mps.Pane>
          <mps.Pane @title="Three">Pane 3</mps.Pane>
        </mp.Scroller>
      </MobilePane>
    `);

    await click('.mobile-pane__nav .nav__item:nth-child(3) a');
    await waitUntil(() => this.changes.length === 1, { timeout: 3000 });

    assert.deepEqual(this.changes, [2]);
    assert.dom('.mobile-pane__pane:nth-child(3)').hasClass('active');
    assert
      .dom('.mobile-pane__nav .nav__item:nth-child(3) a')
      .hasClass('active');
  });

  test('the nav indicator follows the active pane', async function (assert) {
    await render(hbs`
      <MobilePane @activeIndex={{this.activeIndex}} @onChange={{this.onChange}} as |mp|>
        <mp.Nav />
        <mp.Scroller as |mps|>
          <mps.Pane @title="One">Pane 1</mps.Pane>
          <mps.Pane @title="A much longer title">Pane 2</mps.Pane>
        </mp.Scroller>
      </MobilePane>
    `);

    const indicator = this.element.querySelector('.nav__indicator');
    const items = this.element.querySelectorAll('.nav__item');
    const scaleX = () =>
      parseFloat(indicator.style.transform.match(/scaleX\(([\d.]+)\)/)[1]);
    const width = (el) => el.getBoundingClientRect().width;
    const initial = indicator.style.transform;

    assert.ok(initial.includes('translateX'), 'indicator is positioned');
    assert.ok(
      Math.abs(scaleX() - width(items[0])) < 1,
      'indicator is as wide as the first item'
    );

    this.set('activeIndex', 1);
    await settled();

    assert.notStrictEqual(
      indicator.style.transform,
      initial,
      'indicator moved'
    );
    assert.ok(
      Math.abs(scaleX() - width(items[1])) < 1,
      'indicator is as wide as the second item'
    );
  });

  test('clicking a simple indicator dot moves to that pane', async function (assert) {
    await render(hbs`
      <MobilePane @activeIndex={{this.activeIndex}} @onChange={{this.onChange}} as |mp|>
        <mp.Scroller as |mps|>
          <mps.Pane>Pane 1</mps.Pane>
          <mps.Pane>Pane 2</mps.Pane>
          <mps.Pane>Pane 3</mps.Pane>
        </mp.Scroller>
        <mp.SimpleIndicator />
      </MobilePane>
    `);

    await click('.scroller__simple-indicator button:nth-of-type(2)');
    await waitUntil(() => this.changes.length === 1, { timeout: 3000 });

    assert.deepEqual(this.changes, [1]);
    assert.dom('.mobile-pane__pane:nth-child(2)').hasClass('active');
    assert
      .dom('.simple-indicator__indicator')
      .hasAttribute('style', /translateX\(100%\)/);
  });

  test('lazy rendering only renders the active pane and its neighbours', async function (assert) {
    await render(hbs`
      <MobilePane @activeIndex={{this.activeIndex}} @onChange={{this.onChange}} as |mp|>
        <mp.Scroller as |mps|>
          <mps.Pane><span class="content">1</span></mps.Pane>
          <mps.Pane><span class="content">2</span></mps.Pane>
          <mps.Pane><span class="content">3</span></mps.Pane>
          <mps.Pane><span class="content">4</span></mps.Pane>
        </mp.Scroller>
      </MobilePane>
    `);

    assert.dom('.mobile-pane__pane').exists({ count: 4 });
    assert.dom('.content').exists({ count: 2 });
    assert.dom('.mobile-pane__pane:nth-child(1) .content').exists();
    assert.dom('.mobile-pane__pane:nth-child(2) .content').exists();

    this.set('activeIndex', 2);
    assert.dom('.content').exists({ count: 3 });
    assert.dom('.mobile-pane__pane:nth-child(1) .content').doesNotExist();
    assert.dom('.mobile-pane__pane:nth-child(4) .content').exists();
  });

  test('@lazyRendering={{false}} renders all panes', async function (assert) {
    await render(hbs`
      <MobilePane @lazyRendering={{false}} as |mp|>
        <mp.Scroller as |mps|>
          <mps.Pane><span class="content">1</span></mps.Pane>
          <mps.Pane><span class="content">2</span></mps.Pane>
          <mps.Pane><span class="content">3</span></mps.Pane>
          <mps.Pane><span class="content">4</span></mps.Pane>
        </mp.Scroller>
      </MobilePane>
    `);

    assert.dom('.content').exists({ count: 4 });
  });

  test('strict lazy rendering only renders the visible pane', async function (assert) {
    this.activeIndex = 1;
    await render(hbs`
      <MobilePane @activeIndex={{this.activeIndex}} @strictLazyRendering={{true}} as |mp|>
        <mp.Scroller as |mps|>
          <mps.Pane><span class="content">1</span></mps.Pane>
          <mps.Pane><span class="content">2</span></mps.Pane>
          <mps.Pane><span class="content">3</span></mps.Pane>
        </mp.Scroller>
      </MobilePane>
    `);

    assert.dom('.content').exists({ count: 1 });
    assert.dom('.mobile-pane__pane:nth-child(2) .content').exists();
  });

  test('@keepRendered keeps panes rendered once they have been shown', async function (assert) {
    await render(hbs`
      <MobilePane @activeIndex={{this.activeIndex}} @strictLazyRendering={{true}} @keepRendered={{true}} as |mp|>
        <mp.Scroller as |mps|>
          <mps.Pane><span class="content">1</span></mps.Pane>
          <mps.Pane><span class="content">2</span></mps.Pane>
          <mps.Pane><span class="content">3</span></mps.Pane>
        </mp.Scroller>
      </MobilePane>
    `);

    assert.dom('.content').exists({ count: 1 });
    this.set('activeIndex', 1);
    this.set('activeIndex', 2);
    assert.dom('.content').exists({ count: 3 });
  });

  test('panes can be added and removed dynamically', async function (assert) {
    this.showThird = false;
    await render(hbs`
      <MobilePane @lazyRendering={{false}} as |mp|>
        <mp.Nav />
        <mp.Scroller as |mps|>
          <mps.Pane @title="One">1</mps.Pane>
          <mps.Pane @title="Two">2</mps.Pane>
          {{#if this.showThird}}
            <mps.Pane @title="Three">3</mps.Pane>
          {{/if}}
        </mp.Scroller>
      </MobilePane>
    `);

    assert.dom('.mobile-pane__nav .nav__item').exists({ count: 2 });
    assert.dom(SCROLLER).hasAttribute('style', /width: 200%/);

    this.set('showThird', true);
    assert.dom('.mobile-pane__nav .nav__item').exists({ count: 3 });
    assert.dom(SCROLLER).hasAttribute('style', /width: 300%/);

    this.set('showThird', false);
    assert.dom('.mobile-pane__nav .nav__item').exists({ count: 2 });
    assert.dom(SCROLLER).hasAttribute('style', /width: 200%/);
  });

  module('gestures', function (hooks) {
    hooks.beforeEach(function () {
      this.dragStarts = 0;
      this.dragMoves = 0;
      this.onDragStart = () => this.dragStarts++;
      this.onDragMove = () => this.dragMoves++;
    });

    test('panning left moves to the next pane', async function (assert) {
      await render(hbs`
        <MobilePane
          @activeIndex={{this.activeIndex}}
          @onChange={{this.onChange}}
          @onDragStart={{this.onDragStart}}
          @onDragMove={{this.onDragMove}}
          @onDragEnd={{this.onDragEnd}}
        as |mp|>
          <mp.Scroller as |mps|>
            <mps.Pane>1</mps.Pane>
            <mps.Pane>2</mps.Pane>
            <mps.Pane>3</mps.Pane>
          </mp.Scroller>
        </MobilePane>
      `);

      await pan(SCROLLER, 'left');
      await waitForDrag(this);

      assert.strictEqual(this.dragStarts, 1, 'onDragStart fired once');
      assert.ok(this.dragMoves > 0, 'onDragMove fired');
      assert.deepEqual(this.changes, [1]);
      assert.dom('.mobile-pane__pane:nth-child(2)').hasClass('active');
    });

    test('panning right moves to the previous pane', async function (assert) {
      this.activeIndex = 2;
      await render(hbs`
        <MobilePane @activeIndex={{this.activeIndex}} @onChange={{this.onChange}} @onDragEnd={{this.onDragEnd}} as |mp|>
          <mp.Scroller as |mps|>
            <mps.Pane>1</mps.Pane>
            <mps.Pane>2</mps.Pane>
            <mps.Pane>3</mps.Pane>
          </mp.Scroller>
        </MobilePane>
      `);

      await pan(SCROLLER, 'right');
      await waitForDrag(this);

      assert.deepEqual(this.changes, [1]);
      assert.dom('.mobile-pane__pane:nth-child(2)').hasClass('active');
    });

    test('panning past the first pane does not change the active pane', async function (assert) {
      await render(hbs`
        <MobilePane @activeIndex={{this.activeIndex}} @onChange={{this.onChange}} @onDragEnd={{this.onDragEnd}} as |mp|>
          <mp.Scroller as |mps|>
            <mps.Pane>1</mps.Pane>
            <mps.Pane>2</mps.Pane>
          </mp.Scroller>
        </MobilePane>
      `);

      await pan(SCROLLER, 'right');
      await waitForDrag(this);

      assert.deepEqual(this.changes, []);
      assert.dom('.mobile-pane__pane:nth-child(1)').hasClass('active');
      assert.dom(SCROLLER).hasAttribute('style', /translateX\(0%\)/);
    });

    test('@disabled prevents panning', async function (assert) {
      await render(hbs`
        <MobilePane @disabled={{true}} @activeIndex={{this.activeIndex}} @onChange={{this.onChange}} @onDragStart={{this.onDragStart}} as |mp|>
          <mp.Scroller as |mps|>
            <mps.Pane>1</mps.Pane>
            <mps.Pane>2</mps.Pane>
          </mp.Scroller>
        </MobilePane>
      `);

      await pan(SCROLLER, 'left');
      await settled();

      assert.strictEqual(this.dragStarts, 0);
      assert.deepEqual(this.changes, []);
      assert.dom('.mobile-pane__pane:nth-child(1)').hasClass('active');
    });
  });
});
