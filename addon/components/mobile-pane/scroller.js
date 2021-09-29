import Component from '@glimmer/component';
import { htmlSafe } from '@ember/template';
import { action } from '@ember/object';

import Tween from 'ember-mobile-core/tween';

/**
 * @class ScrollComponent
 */
export default class ScrollerComponent extends Component {
  // public

  /**
   * The factor which the paneWidth is multiplied to get the over scroll amount.
   *
   * @argument overScrollFactor
   * @type {Number} between 0 and 1.0
   * @default 0.34
   */
  get overScrollFactor() {
    return this.args.overScrollFactor ?? 0.34;
  }

  // private
  isDragging = false;
  dx = 0;
  dxStart = 0;
  runningAnimation = null;

  get style() {
    return htmlSafe(
      `width: ${this.args.paneCount * 100}%; transform: translateX(${
        this.args.currentOffset
      }%);`
    );
  }

  // gesture recognition -------------------------------------------------------
  _getPaneWidth() {
    return this.args.paneContainerElement.clientWidth;
  }

  @action
  didPanStart(e) {
    if (!this.args.disabled) {
      const { distanceX } = e.current;

      const activeIndex = this.args.activeIndex;

      // Prevent capturing the pan events when overScroll is off and we're
      // at the end of the scroller.
      if (
        !(
          this.overScrollFactor === 0 &&
          ((activeIndex === 0 && distanceX > 0) ||
            (activeIndex === this.args.paneCount - 1 && distanceX < 0))
        )
      ) {
        // TODO: this.lockPan();
        // add a dragging class so any css transitions are disabled
        // and the pan event is enabled
        this.isDragging = true;

        const anim = this.runningAnimation;
        if (anim) {
          anim.stop();
          this.runningAnimation = null;
          this.dxStart = this.dx;
        } else {
          this.dxStart = 0;
        }

        this.args.onDragStart();
      }
    }
  }

  @action
  didPan(e) {
    if (this.isDragging) {
      const { distanceX } = e.current;

      const activeIndex = this.args.activeIndex;
      const paneWidth = this._getPaneWidth();
      const paneCount = this.args.paneCount;

      const targetDistanceX =
        (this.dxStart / 100) * paneWidth * paneCount + distanceX;

      // limit dx to -1, +1 pane
      const dx = Math.max(Math.min(targetDistanceX, paneWidth), -paneWidth);
      let targetOffset = (100 * dx) / paneWidth / paneCount;

      // overscroll effect
      if (
        (activeIndex === 0 && targetOffset > 0) ||
        (activeIndex === paneCount - 1 && targetOffset < 0)
      ) {
        targetOffset *= this.overScrollFactor;
      }

      this.dx = targetOffset;
      this.args.onDragMove(targetOffset);
    }
  }

  @action
  didPanEnd(e) {
    if (this.isDragging) {
      const { velocityX } = e.current;

      this.isDragging = false;

      const dx = this.dx;
      const paneCount = this.args.paneCount;
      const currentIndex = this.args.activeIndex;
      const rawTargetIndex = (dx * paneCount) / -100;

      let targetIndex = Math.max(
        Math.min(currentIndex + Math.round(rawTargetIndex), paneCount - 1),
        0
      );

      if (targetIndex === currentIndex) {
        if (
          velocityX < -1 * this.args.triggerVelocity &&
          targetIndex < paneCount - 1
        ) {
          targetIndex++;
        } else if (velocityX > this.args.triggerVelocity && targetIndex > 0) {
          targetIndex--;
        }
      }

      this.finishTransition(targetIndex);
    }
  }

  async finishTransition(targetIndex) {
    const dx = this.dx;
    const currentIndex = this.args.activeIndex;
    const target =
      (targetIndex - currentIndex) * (-100 / this.args.paneCount) - dx;

    const anim = new Tween(
      (progress) => {
        const currentPos = dx + target * progress;
        this.dx = currentPos;
        this.args.onDragMove(currentPos);
      },
      { duration: this.transitionDuration }
    );
    this.runningAnimation = anim;
    await anim.start();

    this.runningAnimation = null;
    this.dx = 0;

    this.args.onDragEnd(targetIndex);
  }
}
