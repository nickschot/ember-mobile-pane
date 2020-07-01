import Component from '@ember/component';
import layout from '../../templates/components/mobile-pane-infinite/child';
import { get, computed } from '@ember/object';
import { htmlSafe } from '@ember/string';

export default Component.extend({
  layout,

  classNames: ['mobile-pane__child'],
  attributeBindings: ['style'],

  // protected
  setAsDocumentScroll: false,
  scroll: 0,
  offsetTop: 0,

  didRender(){
    this._super(...arguments);

    if(this.setAsDocumentScroll){
      const current     = document.scrollingElement || document.documentElement;
      current.scrollTop = this.scroll;
    } else {
      this.element.querySelector('.mobile-pane__child-transformable').style.transform = `translateY(-${this.scroll}px)`;
    }
  },

  style: computed('offsetTop', function(){
    return this.offsetTop ? htmlSafe(`transform: translateY(${this.offsetTop}px);`) : null;
  })
});
