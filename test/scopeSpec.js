'use strict';

var Scope = require('../src/scope');

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

  it('', function () {

  });

});
