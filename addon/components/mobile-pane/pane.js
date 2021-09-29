import Component from '@glimmer/component';
import { guidFor } from '@ember/object/internals';

/**
 * @class PaneComponent
 */
export default class PaneComponent extends Component {
  // public
  /**
   * Title of the pane. Used in the NavComponent  if it's present.
   *
   * @argument title
   * @type ''
   * @default null
   */
  get title() {
    return this.args.title ?? null;
  }

  // private
  elementId = guidFor(this);

  /**
   * Whether or not the pane was rendered before. Used for lazyRendering.
   *
   * @property didRender
   * @private
   */
  didRender = false;

  willDestroy() {
    this.args.unregisterPane(this);
    super.willDestroy(...arguments);
  }

  /**
   * True if this pane is the active pane.
   *
   * @property isActive
   * @private
   */
  get isActive() {
    return this === this.args.activePane;
  }

  get renderContent() {
    if (
      this.args.lazyRendering &&
      !(this.args.keepRendered && this.didRender)
    ) {
      const willRender = !!this.args.visiblePanes.find(
        (item) => item.elementId === this.elementId
      );

      if (willRender) {
        // eslint-disable-next-line ember/no-side-effects
        this.didRender = true;
      }

      return willRender;
    }

    return true;
  }
}
