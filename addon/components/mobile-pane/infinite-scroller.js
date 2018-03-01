import Component from '@ember/component';
import layout from '../../templates/components/mobile-pane/infinite-scroller';

import { inject as service } from '@ember/service';
import { get, computed, observer } from '@ember/object';
import { once } from '@ember/runloop';

export default Component.extend({
  layout,

  classNames: ['mobile-pane__infinite-scroller'],

  router: service(),

  //public
  previousModel: null,
  currentModel: null,
  nextModel: null,

  //private
  scrollOffset: 0,

  onDragStart(){},
  onDragMove(dx){},
  onDragEnd(activeIndex){},

  updateActiveIndex: observer('models.@each.id', function(){
    once(() => {
      // we received new models, update activeIndex to the currentModel index
      const activeIndex = get(this, 'previousModel') ? 1 : 0;
      get(this, 'onDragEnd')(activeIndex);
    });
  }),

  models: computed('previousModel', 'currentModel', 'nextModel', function(){
    console.log(Boolean);
    return [get(this, 'previousModel'), get(this, 'currentModel'), get(this, 'nextModel')].filter(Boolean);
  }),

  actions: {
    onDragStart(){
      get(this, 'onDragStart')(...arguments);
    },
    onDragMove(){
      get(this, 'onDragMove')(...arguments);
    },
    onDragEnd(targetIndex){
      // transition to previous or next model
      const targetModel = get(this, 'models').objectAt(targetIndex);
      if(targetModel !== get(this, 'currentModel')){
        get(this, 'router').transitionTo(get(this, 'router.currentRouteName'), targetModel);
      }

      get(this, 'onDragEnd')(...arguments);
    }
  }
});
