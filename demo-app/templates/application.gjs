import Component from '@glimmer/component';
import { tracked } from '@glimmer/tracking';
import { MobilePane, MobilePaneInfinite } from '#src/index.js';

const INFINITE_MODELS = [1, 2, 3, 4, 5];

class Demo extends Component {
  @tracked activeIndex = 0;
  @tracked previousModel = 1;
  @tracked currentModel = 2;
  @tracked nextModel = 3;

  changeActiveIndex = (index) => {
    this.activeIndex = index;
  };

  changeModel = (model) => {
    const index = INFINITE_MODELS.indexOf(model);
    this.previousModel = INFINITE_MODELS[index - 1];
    this.currentModel = INFINITE_MODELS[index];
    this.nextModel = INFINITE_MODELS[index + 1];
  };

  <template>
    <h2>MobilePane</h2>

    <MobilePane
      @activeIndex={{this.activeIndex}}
      @onChange={{this.changeActiveIndex}}
      @strictLazyRendering={{true}}
      as |mp|
    >
      <mp.Nav />
      <mp.Scroller as |mps|>
        <mps.Pane @title="Pane 1">Pane 1</mps.Pane>
        <mps.Pane @title="Long Pane 2">Pane 2</mps.Pane>
        <mps.Pane @title="Pane 3">Pane 3</mps.Pane>
        <mps.Pane @title="Pane 4">Pane 4</mps.Pane>
        <mps.Pane @title="Pane 5">Pane 5</mps.Pane>
        <mps.Pane @title="Pane 6">Pane 6</mps.Pane>
      </mp.Scroller>
      <mp.SimpleIndicator />
    </MobilePane>

    <h2>MobilePaneInfinite</h2>

    <MobilePaneInfinite
      @previousModel={{this.previousModel}}
      @currentModel={{this.currentModel}}
      @nextModel={{this.nextModel}}
      @onChange={{this.changeModel}}
      as |mpi|
    >
      Pane
      {{mpi.model}}
    </MobilePaneInfinite>
  </template>
}

<template><Demo /></template>
