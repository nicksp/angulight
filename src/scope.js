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
  this.$$lastDirtyWatch = null;
}

Scope.prototype.$watch = function (watchFn, listenerFn, objectEquality) {
  var watcher = {
    watchFn: watchFn,
    listenerFn: listenerFn || noop,
    objectEquality: !!objectEquality,
    last: initWatchVal
  };
  this.$$watchers.push(watcher);
  this.$$lastDirtyWatch = null;
};

Scope.prototype.$$digestOnce = function () {
  var _this = this;
  var isDirty = false, newValue, oldValue;

  _.forEach(this.$$watchers, function (watcher) {
    newValue = watcher.watchFn(_this);
    oldValue = watcher.last;

    if (!_this.$$areEqual(newValue, oldValue, watcher.objectEquality)) {
      _this.$$lastDirtyWatch = watcher;
      watcher.last = (watcher.objectEquality ? _.cloneDeep(newValue) : newValue);
      watcher.listenerFn(newValue, (oldValue === initWatchVal ? newValue : oldValue), _this);
      isDirty = true;
    } else if (_this.$$lastDirtyWatch === watcher) {
      return false;
    }
  });
  return isDirty;
};

Scope.prototype.$digest = function () {
  var TTL = 10;
  var isDirty;
  this.$$lastDirtyWatch = null;

  do {
    isDirty = this.$$digestOnce();
    if (isDirty && !(TTL--)) {
      throw '10 $digest() iterations reached';
    }
  } while (isDirty);
};

Scope.prototype.$$areEqual = function (newValue, oldValue, objectEquality) {
  if (objectEquality) {
    return _.isEqual(newValue, oldValue);
  } else {
    return newValue === oldValue ||
      (typeof newValue === 'number' && typeof oldValue === 'number' &&
      isNaN(newValue) && isNaN(oldValue));
  }
};

Scope.prototype.$eval = function (expr, locals) {
  return expr(this, locals);
};

module.exports = Scope;
