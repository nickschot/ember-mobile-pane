import * as emberService from '@ember/service';

/**
 * `service` was added in ember-source 4.1 and `inject` was removed in 7.0.
 * This picks whichever is available so we can support both.
 *
 * See https://deprecations.emberjs.com/id/importing-inject-from-ember-service
 *
 * @private
 */
export const service = emberService.service ?? emberService.inject;
