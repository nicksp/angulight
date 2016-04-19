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
  this.$$asyncQueue = [];
  this.$$applyAsyncQueue = [];
  this.$$applyAsyncId = null;
  this.$$postDigestQueue = [];
  this.$$phase = null;
}

Scope.prototype.$watch = function (watchFn, listenerFn, objectEquality) {
  var _this = this;
  var watcher = {
    watchFn: watchFn,
    listenerFn: listenerFn || noop,
    objectEquality: !!objectEquality,
    last: initWatchVal
  };
  this.$$watchers.unshift(watcher);
  this.$$lastDirtyWatch = null;

  return function () {
    var index = _this.$$watchers.indexOf(watcher);
    if (index >= 0) {
      _this.$$watchers.splice(index, 1);
      _this.$$lastDirtyWatch = null;
    }
  };
};

Scope.prototype.$$digestOnce = function () {
  var _this = this;
  var isDirty = false, newValue, oldValue;

  _.forEachRight(this.$$watchers, function (watcher) {
    try {
      if (watcher) {
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
      }
    } catch (e) {
      console.error(e);
    }
  });
  return isDirty;
};

Scope.prototype.$digest = function () {
  var TTL = 10;
  var isDirty;
  this.$$lastDirtyWatch = null;
  this.$beginPhase('$digest');

  if (this.$$applyAsyncId) {
    clearTimeout(this.$$applyAsyncId);
    this.$$flushApplyAsync();
  }

  do {
    while (this.$$asyncQueue.length) {
      try {
        var asyncTask = this.$$asyncQueue.shift();
        asyncTask.scope.$eval(asyncTask.expression);
      } catch (e) {
        console.error(e);
      }
    }

    isDirty = this.$$digestOnce();
    if ((isDirty || this.$$asyncQueue.length) && !(TTL--)) {
      this.$clearPhase();
      throw '10 $digest() iterations reached';
    }
  } while (isDirty || this.$$asyncQueue.length);

  this.$clearPhase();


  while (this.$$postDigestQueue.length) {
    try {
      this.$$postDigestQueue.shift()();
    } catch (e) {
      console.error(e);
    }
  }

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

Scope.prototype.$apply = function (expr) {
  try {
    this.$beginPhase('$apply');
    return this.$eval(expr);
  } finally {
    this.$clearPhase();
    this.$digest();
  }
};

Scope.prototype.$evalAsync = function (expr) {
  var _this = this;
  if (!this.$$phase && !this.$$asyncQueue.length) {
    setTimeout(function () {
      if (_this.$$asyncQueue.length) {
        _this.$digest();
      }
    }, 0);
  }
  this.$$asyncQueue.push({ scope: this, expression: expr });
};

Scope.prototype.$applyAsync = function (expr) {
  var _this = this;
  this.$$applyAsyncQueue.push(function () {
    _this.$eval(expr);
  });

  if (this.$$applyAsyncId === null) {
    _this.$$applyAsyncId = setTimeout(function () {
      _this.$apply(_.bind(_this.$$flushApplyAsync, _this));
    }, 0);
  }
};

Scope.prototype.$$postDigest = function (fn) {
  this.$$postDigestQueue.push(fn);
};

Scope.prototype.$$flushApplyAsync = function () {
  while (this.$$applyAsyncQueue.length) {
    try {
      this.$$applyAsyncQueue.shift()();
    } catch (e) {
      console.error(e);
    }
  }
  this.$$applyAsyncId = null;
};

Scope.prototype.$beginPhase = function (phase) {
  if (this.$$phase) {
    throw this.$$phase + ' is already in progress.';
  }
  this.$$phase = phase;
};

Scope.prototype.$clearPhase = function () {
  this.$$phase = null;
};

Scope.prototype.$watchGroup = function (watchFns, listenerFn) {
  var _this = this;
  var newValues = new Array(watchFns.length);
  var oldValues = new Array(watchFns.length);
  var changeReactionScheduled = false;
  var firstRun = true;

  if (watchFns.length === 0) {
    var shouldCall = true;
    _this.$evalAsync(function () {
      if (shouldCall) {
        listenerFn(newValues, newValues, _this);
      }
    });
    return function () {
      shouldCall = false;
    };
  }

  function watchGroupListener() {
    if (firstRun) {
      firstRun = false;
      listenerFn(newValues, newValues, _this);
    } else {
      listenerFn(newValues, oldValues, _this);
    }
    changeReactionScheduled = false;
  }

  var destroyFunctions = _.map(watchFns, function (watchFn, i) {
    return _this.$watch(watchFn, function (newValue, oldValue) {
      newValues[i] = newValue;
      oldValues[i] = oldValue;
      if (!changeReactionScheduled) {
        changeReactionScheduled = true;
        _this.$evalAsync(watchGroupListener);
      }
    });
  });

  return function () {
    _.forEach(destroyFunctions, function (destroyFunction) {
      destroyFunction();
    });
  };
};

Scope.prototype.$new = function () {
  var ChildScope = function () {};
  ChildScope.prototype = this;
  var child = new ChildScope();
  return child;
};

module.exports = Scope;
