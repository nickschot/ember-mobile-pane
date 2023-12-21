import Controller from '@ember/controller';
import { action } from '@ember/object';
import { tracked } from '@glimmer/tracking';

export default class ApplicationController extends Controller {
  activeIndex = 0;

  infiniteModels = [1, 2, 3];
  @tracked previousModel = 1;
  @tracked currentModel = 2;
  @tracked nextModel = 3;

  @action
  handleChange(model) {
    let index = this.infiniteModels.indexOf(model);
    this.previousModel = this.infiniteModels[index - 1];
    this.currentModel = this.infiniteModels[index];
    this.nextModel = this.infiniteModels[index + 1];
  }
}
