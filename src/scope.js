'use strict';

var _ = require('lodash');

function initWatchVal() {}

/**
 * @ngdoc function
 * @name angular.noop
 * @kind function
 *
 * @description
 * A function that performs no operations. This function can be useful when writing code in the
 * functional style.
   ```js
     function foo(callback) {
       var result = calculateResult();
       (callback || angular.noop)(result);
     }
   ```
 */
function noop() {}

function Scope() {
  this.$$watchers = [];
}

Scope.prototype.$watch = function (watchFn, listenerFn) {
  var watcher = {
    watchFn: watchFn,
    listenerFn: listenerFn || noop,
    last: initWatchVal
  };
  this.$$watchers.push(watcher);
};

Scope.prototype.$$digestOnce = function () {
  var _this = this;
  var isDirty = false, newValue, oldValue;

  _.forEach(this.$$watchers, function (watcher) {
    newValue = watcher.watchFn(_this);
    oldValue = watcher.last;

    if (newValue !== oldValue) {
      watcher.last = newValue;
      watcher.listenerFn(newValue, (oldValue === initWatchVal ? newValue : oldValue), _this);
      isDirty = true;
    }
  });
  return isDirty;
};

Scope.prototype.$digest = function () {
  var TTL = 10;
  var isDirty;

  do {
    isDirty = this.$$digestOnce();
    if (isDirty && !(TTL--)) {
      throw '10 $digest() iterations reached';
    }
  } while (isDirty);
};

module.exports = Scope;
