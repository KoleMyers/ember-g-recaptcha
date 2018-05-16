import Component from '@ember/component';
import { alias } from '@ember/object/computed';
import { isNone } from '@ember/utils';
import { later } from '@ember/runloop';
import { merge } from '@ember/polyfills';
import { isPresent } from '@ember/utils';
import { next } from '@ember/runloop';
import Configuration from '../configuration';
import $ from 'jquery';
import { defer } from 'rsvp';

const gRecaptchaLoaded = defer();
window.gRecaptchaCallback = () => {
  gRecaptchaLoaded.resolve();
}

export default Component.extend({

  classNames: ['g-recaptcha'],

  sitekey: Configuration.siteKey,

  tabindex: alias('tabIndex'),

  renderReCaptcha() {
    next(() => {
      let container = this.$()[0];
      let properties = this.getProperties(
        'sitekey',
        'theme',
        'type',
        'size',
        'tabindex',
        'hl'
      );
      let parameters = merge(properties, {
        callback: this.get('successCallback').bind(this),
        'expired-callback': this.get('expiredCallback').bind(this)
      });
      let widgetId = window.grecaptcha.render(container, parameters);
      this.set('widgetId', widgetId);
      this.set('ref', this);
    });
  },

  resetReCaptcha() {
    if (isPresent(this.get('widgetId'))) {
      window.grecaptcha.reset(this.get('widgetId'));
    }
  },

  successCallback(reCaptchaResponse) {
    let action = this.get('onSuccess');
    if (isPresent(action)) {
      action(reCaptchaResponse);
    }
  },

  expiredCallback() {
    let action = this.get('onExpired');
    if (isPresent(action)) {
      action();
    } else {
      this.resetReCaptcha();
    }
  },

  loadGoogleRecaptcha() {
    //TODO Configuration.gReCaptcha.jsUrl || default url
    let src = 'https://www.google.com/recaptcha/api.js?onload=gRecaptchaCallback&render=explicit';
    $.getScript(src);
  },

  // Lifecycle Hooks

  didInsertElement() {
    this._super(...arguments);
    if (window.grecaptcha) {
        this.renderReCaptcha();
    } else {
      gRecaptchaLoaded.promise.then(() => {
        if (!this.isDestroyed) {
          this.renderReCaptcha();
        }
      });
      this.loadGoogleRecaptcha();
    }
  }

});
