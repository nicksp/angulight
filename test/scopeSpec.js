'use strict';

var Scope = require('../src/scope');
var _ = require('lodash');

describe('Scope', function () {

  it('can be constructed and used as an object', function () {
    var scope = new Scope();
    scope.aProp = 1;

    expect(scope.aProp).toBe(1);
  });

});

describe('digest', function () {
  var scope;

  beforeEach(function () {
    scope = new Scope();
  });

  it('calls the listener function of a watcher on first $digest', function () {
    var watchFn = function () { return 'wat'; };
    var listenerFn = jasmine.createSpy();

    scope.$watch(watchFn, listenerFn);
    scope.$digest();

    expect(listenerFn).toHaveBeenCalled();
  });

  it('calls the watch function of a watcher with the scope as an argument', function () {
    var watchFn = jasmine.createSpy();
    var listenerFn = function () {};

    scope.$watch(watchFn, listenerFn);
    scope.$digest();

    expect(watchFn).toHaveBeenCalledWith(scope);
  });

  it('calls the listener function when the watched value changes (when the watcher is dirty)', function () {
    scope.someValue = 'a';
    scope.counter = 0;

    scope.$watch(
      function (scope) { return scope.someValue; },
      function (newValue, oldValue, scope) { scope.counter++; }
    );

    expect(scope.counter).toBe(0);

    // the listener is always called during the first $digest loop after it was registered
    scope.$digest();
    expect(scope.counter).toBe(1);

    // but now it won't be called unless the value changes
    scope.$digest();
    expect(scope.counter).toBe(1);

    scope.$digest();
    expect(scope.counter).toBe(1);

    scope.someValue = 'b';
    expect(scope.counter).toBe(1);

    scope.$digest();
    expect(scope.counter).toBe(2);
  });

  it('calls the listener function when watch value is first undefined', function () {
    scope.counter = 0;

    scope.$watch(
      function (scope) { return scope.someValue; },
      function (newValue, oldValue, scope) { scope.counter++; }
    );

    expect(scope.counter).toBe(0);

    scope.$digest();
    expect(scope.counter).toBe(1);
  });

  it('calls listener with new value as old value the first time', function () {
    scope.someValue = 123;
    var oldValueGiven;

    scope.$watch(
      function (scope) { return scope.someValue; },
      function (newValue, oldValue, scope) { oldValueGiven = oldValue; }
    );

    scope.$digest();
    expect(oldValueGiven).toBe(123);
  });

  it('may have watchers that omit the listener function', function () {
    var watchFn = jasmine.createSpy().and.returnValue('something');
    scope.$watch(watchFn);

    scope.$digest();

    expect(watchFn).toHaveBeenCalled();
  });

  it('triggers changed watchers in the same digest', function () {
    scope.name = 'Jane';

    scope.$watch(
      function (scope) { return scope.nameUpper; },
      function (newValue, oldValue, scope) {
        if (newValue) {
          scope.initial = newValue.substring(0, 1) + '.';
        }
      }
    );

    scope.$watch(
      function (scope) { return scope.name; },
      function (newValue, oldValue, scope) {
        if (newValue) {
          scope.nameUpper = newValue.toUpperCase();
        }
      }
    );

    scope.$digest();
    expect(scope.initial).toBe('J.');

    scope.name = 'bob';

    scope.$digest();
    expect(scope.initial).toBe('B.');
  });

  it('gives up on a watchers after 10 iterations', function () {
    scope.counterA = 0;
    scope.counterB = 0;

    scope.$watch(
      function (scope) { return scope.counterA; },
      function (newValue, oldValue, scope) { scope.counterB++; }
    );

    scope.$watch(
      function (scope) { return scope.counterB; },
      function (newValue, oldValue, scope) { scope.counterA++; }
    );

    expect((function () { scope.$digest(); })).toThrow();
  });

  it('ends the digest when the last watch is clean', function () {
    scope.array = _.range(100);
    var watchExecutions = 0;

    _.times(100, function (i) {
      scope.$watch(
        function (scope) {
          watchExecutions++;
          return scope.array[i];
        },
        function (newValue, oldValue, scope) {}
      );
    });

    scope.$digest();
    expect(watchExecutions).toBe(200);

    scope.array[0] = 320;
    scope.$digest();
    expect(watchExecutions).toBe(301);
  });

  it('doesn\'t end digest so that new watchers are not run', function () {
    scope.aValue = 'abc';
    scope.counter = 0;

    scope.$watch(
      function (scope) { return scope.aValue; },
      function (newValue, oldValue, scope) {
        scope.$watch(
          function (scope) { return scope.aValue; },
          function (newValue, oldValue, scope) {
            scope.counter++;
          }
        );
      }
    );

    scope.$digest();
    expect(scope.counter).toBe(1);
  });

  it('compares based on value if enabled', function () {
    scope.aValue = [1, 2, 3];
    scope.counter = 0;

    scope.$watch(
      function (scope) { return scope.aValue; },
      function (newValue, oldValue, scope) { scope.counter++; },
      true
    );

    scope.$digest();
    expect(scope.counter).toBe(1);

    scope.aValue.push(4);
    scope.$digest();
    expect(scope.counter).toBe(2);
  });

  it('correctly handles NaNs', function () {
    scope.number = 0 / 0; // NaN
    scope.counter = 0;

    scope.$watch(
      function (scope) { return scope.number; },
      function (newValue, oldValue, scope) {
        scope.counter++;
      }
    );

    scope.$digest();
    expect(scope.counter).toBe(1);

    scope.$digest();
    expect(scope.counter).toBe(1);
  });

  it('executes $eval\'ed function and returns result', function () {
    scope.aValue = 42;

    var result = scope.$eval(function (scope) {
      return scope.aValue;
    });

    expect(result).toBe(42);
  });

  it('passes the second $eval argument straight through', function () {
    scope.aValue = 42;

    var result = scope.$eval(function (scope, arg) {
      return scope.aValue + arg;
    }, 2);

    expect(result).toBe(44);
  });

  it('executes $apply\'ed function and starts the digest', function () {
    scope.aValue = 'Some value';
    scope.counter = 0;

    scope.$watch(
      function(scope) { return scope.aValue; },
      function(newValue, oldValue, scope) { scope.counter++; }
    );

    scope.$digest();
    expect(scope.counter).toBe(1);

    scope.$apply(function (scope) {
      scope.aValue = 'someOtherValue';
    });
    expect(scope.counter).toBe(2);
  });

  it('', function () {

  });

});
