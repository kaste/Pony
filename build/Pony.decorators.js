this.Pony = this.Pony || {};
(function (exports) {
  'use strict';

  function decorator(target, name, descriptor) {
    // support using decorator(fn) as well as
    // @decorator foo() {}
    let functionApplication = arguments.length === 1;
    let fn = functionApplication ? target : descriptor.value;

    function decoratedDecorator(...args) {
      // function decoratedDecorator(target, name, descriptor) {

      // vanilla call @myDecorator
      if (args.length === 3) {
        fn(...args);
      } else {
        // @myDecorator({name: value})
        let options = args;
        return function (target, name, descriptor) {
          fn(target, name, descriptor, ...args);
        };
      }
    }

    if (functionApplication) {
      return decoratedDecorator;
    } else {
      descriptor.value = decoratedDecorator;
    }
  }

  function log(target, name, descriptor) {
    let fn = descriptor.value;
    if (target.is) {
      name = `<${ target.is }>.${ name }`;
    }
    descriptor.value = function (...args) {
      /* eslint-disable no-console */
      console.log('%c' + name, 'font-weight: 700', ...args);
      /* eslint-enable no-console */
      return fn.apply(this, args);
    };
  }

  function perf(target, name, descriptor) {
    let fn = descriptor.value;
    descriptor.value = function (...args) {
      let before = window.performance.now();
      let rv = fn.apply(this, args);
      let after = window.performance.now();
      let delta = after - before;
      let argsSignature = args.join(', ');
      let callSignature = `${ name }(${ argsSignature })`;
      /* eslint-disable no-console */
      console.log(`${ callSignature } took ${ delta }ms`);
      /* eslint-enable no-console */
      return rv;
    };
  }

  /**
   * Memoize a function which accepts exactly one argument.
   */
  function memoize(target, fnName, descriptor) {
    let fn = descriptor.value;
    let cacheName = `__memoize_cache_${ fnName }__`;
    descriptor.value = function (arg) {
      let cache = this[cacheName];
      if (!cache) {
        cache = this[cacheName] = {};
      }
      if (arg in cache) {
        return cache[arg];
      }
      return cache[arg] = fn.call(this, arg);
    };
  }

  function installProperty(target, name, options) {
    if (!target.properties) {
      target.properties = {};
    }

    target.properties[name] = options;
  }

  function installPropertyObserver(target, fnName, propertyName) {
    if (!target.properties) {
      target.properties = {};
    }
    if (!target.properties[propertyName]) {
      target.properties[propertyName] = {};
    }
    if (target.properties[propertyName].observer) {
      throw new Error(`Already observing the property ${ propertyName }`);
    }
    target.properties[propertyName].observer = fnName;
  }

  function installComplexObserver(target, fnName, argumentDeclaration) {
    let observeDeclaration = `${ fnName }${ argumentDeclaration }`;
    if (!target.observers) {
      target.observers = [];
    }
    target.observers.push(observeDeclaration);
  }

  function ensureBehavior(proto, behavior) {
    if (!proto.behaviors) {
      proto.behaviors = [];
    }

    if (proto.behaviors.indexOf(behavior) === -1) {
      proto.behaviors.push(behavior);
    }
  }

  /**
   * Polymer already comes with the debounce function, and this is just the
   * decorator form of it.
   *
   *    @debounce
   *    _clickHandler(ev) { ... }
   *
   * is essentially the same as
   *
   *    @debounce({ms: 0, name: '_clickHandler'})
   *    _clickHandler(ev) { ... }
   *
   * `name` is the job name AKA name of the debouncer. You use the name e.g.
   * to cancel the debouncer `this.cancelDebouncer(name)`. Defaults to the
   * method name.
   * `ms` is amount of time to wait measured in milliseconds. Defaults to 0
   * which has the special meaning of firing at the end of the microtask.
   * `reassign` determines if the callback should be kept up-to-date within
   * the time frame given by ms. Defaults to true, which means that the
   * last call within the time frame will be executed. If you set this to
   * false, the actual first call will succeed.
   *
   */
  const debounce = decorator(function debounce(target, fnName, descriptor, { ms = 0, name = fnName, reassign = true } = {}) {

    let fn = descriptor.value;
    descriptor.value = function (...args) {
      if (reassign || !this.isDebouncerActive(name)) {
        let callback = () => fn.apply(this, args);
        this.debounce(name, callback, ms);
      } else {
        let debouncer = this._debouncers[name];
        this.debounce(name, debouncer.callback, ms);
      }
    };
  });

  /**
   * Throttles executing a method
   *
   * A cousin of the debounce decorator. Fires after the specified amount of
   * time has been elapsed. The internal timer will not be reset on each
   * method call as with the debounce, so throttle fires essentially
   * after x milliseconds after the _first_ call. Can be used vanilla or
   * with explicit options.
   *
   *    @throttle
   *    _clickHandler(ev) { ... }
   *
   *    @throttle({ms: 0, name: '_clickHandler'})
   *    _clickHandler(ev) { ... }
   *
   * `name` is the job name AKA name of the debouncer. You use the name e.g.
   * to cancel the debouncer `this.cancelDebouncer(name)`. Defaults to the
   * method name.
   * `ms` is amount of time to wait measured in milliseconds. Defaults to 0
   * which has the special meaning of firing at the end of the microtask.
   * `reassign` determines if the callback should be kept up-to-date within
   * the time frame given by ms. Defaults to true, which means that the
   * last call within the time frame will be executed. If you set this to
   * false, the actual first call will succeed.
   *
   */
  const throttle = decorator(function throttle(target, fnName, descriptor, { ms = 0, name = fnName, reassign = true } = {}) {
    let fn = descriptor.value;
    descriptor.value = function (...args) {
      if (!this.isDebouncerActive(name)) {
        let callback = () => fn.apply(this, args);
        this.debounce(name, callback, ms);
      } else if (reassign) {
        let callback = () => fn.apply(this, args);
        let debouncer = this._debouncers[name];
        debouncer.callback = callback;
      }
    };
  });

  /**
   * Cancels the debouncer with the given name.
   *
   * No vanilla call is supported.
   *
   *    @cancelsDebouncer('_clickHandler')
   *    _tapHandler(ev) { ... }
   *
   */
  const cancelsDebouncer = decorator(function cancelsDebouncer(target, fnName, descriptor, jobName) {
    let fn = descriptor.value;
    descriptor.value = function (...args) {
      this.cancelDebouncer(jobName);
      return fn.apply(this, args);
    };
  });

  /**
   * The decorator version of Polymer's async function.
   *
   *    @async
   *    _attached() { ... }
   *
   *    @async({ms: 100})
   *    _attached() { ... }
   *
   * `ms` is the amount of time in milliseconds to wait before the method
   * gets executed. Defaults to 0, which means execute at the end of the
   * microtask.
   *
   */
  const async = decorator(function async(target, fnName, descriptor, { ms = 0 } = {}) {
    let fn = descriptor.value;
    descriptor.value = function (...args) {
      let callback = () => fn.apply(this, args);
      this.async(callback, ms);
    };
  });

  const observer = decorator(function observer(target, fnName, descriptor, argumentDeclaration) {

    if (argumentDeclaration) {
      // @observer('foo') fooChanged() {}
      if (argumentDeclaration[0] !== '(') {
        let propertyName = argumentDeclaration;
        installPropertyObserver(target, fnName, propertyName);
        return;
      }

      // @observer('(foo, bar)') sideEffect(foo, bar) {}
      installComplexObserver(target, fnName, argumentDeclaration);
      return;
    }

    // @observer _fooChanged() {}
    // or: @observer fooChanged() {}
    let matches = fnName.match(/(?:_)?(.+)Changed/);
    if (matches) {
      let propertyName = matches[1];
      installPropertyObserver(target, fnName, propertyName);
      return;
    }

    throw new Error(`Can't guess what to observe for ${ fnName }`);
  });

  const asyncObserver = decorator(function asyncObserver(target, fnName, descriptor, argumentDeclaration) {

    observer(argumentDeclaration)(target, fnName, descriptor);
    debounce(target, fnName, descriptor);
  });

  function popProp(obj, key, def = undefined) {
    if (key in obj) {
      const rv = obj[key];
      delete obj[key];
      return rv;
    }
    return def;
  }

  function downcase(string) {
    return string.charAt(0).toLowerCase() + string.slice(1);
  }

  function splitAtLastChar(str, char = ' ') {
    // Surprisingly this works for 'click' as well as for 'selector click'.
    const idx = str.lastIndexOf(char);
    return splitAt(str, idx);
  }

  function splitAt(str, idx) {
    return [str.substring(0, idx), str.substring(idx + 1)];
  }

  var _obj;
  function _applyDecoratedDescriptor(target, property, decorators, descriptor, context) {
    var desc = {};
    Object['ke' + 'ys'](descriptor).forEach(function (key) {
      desc[key] = descriptor[key];
    });
    desc.enumerable = !!desc.enumerable;
    desc.configurable = !!desc.configurable;

    if ('value' in desc || desc.initializer) {
      desc.writable = true;
    }

    desc = decorators.slice().reverse().reduce(function (desc, decorator) {
      return decorator(target, property, desc) || desc;
    }, desc);

    if (context && desc.initializer !== void 0) {
      desc.value = desc.initializer ? desc.initializer.call(context) : void 0;
      desc.initializer = undefined;
    }

    if (desc.initializer === void 0) {
      Object['define' + 'Property'](target, property, desc);
      desc = null;
    }

    return desc;
  }

  /**
   * Automatically add/remove event listeners on attach/detach.
   *
   *    @on('click')
   *    _handleClick(ev) { ... }
   *
   *    @on('.selector click')
   *    _handleClick(ev) { ... }
   *
   * As a convenience `window` can be used as selector:
   *
   *    @on('window resize')
   *    _handleResize(ev) { ... }
   *
   * Compared to Polymer's listeners object `on` supports arbitrary
   * selectors which are finally resolved using `this.$$(selector)`
   * (Polymer uses `this.$[selector]` which can only target elements with
   * an explicit id set).
   * Secondly, the event listeners will be removed on detach.
   *
   *
   * No vanilla call supported.
   */
  const on = decorator(function on(target, fnName, descriptor, eventDescription) {

    let fn = descriptor.value;
    installEventHandler(target, eventDescription, fn);
  });

  function installEventHandler(target, trigger, fn) {
    ensureBehavior(target, InstallEventListeners);

    const [selector, eventName] = splitAtLastChar(trigger, ' ');
    addListenerInfo(target, { selector, eventName, fn });
  }

  function addListenerInfo(target, description) {
    if (!target.__listenerInfos) {
      target.__listenerInfos = [];
    }
    target.__listenerInfos.push(description);
  }

  const InstallEventListeners = (_obj = {

    attached() {
      this._addRemoveListeners(this.__listenerInfos, 'addEventListener');
    },

    detached() {
      this._addRemoveListeners(this.__listenerInfos, 'removeEventListener');
    },

    _addRemoveListeners(listenerInfos, methodName) {
      for (let { eventName, selector, fn } of listenerInfos) {
        let node = this._getNodeForSelector(selector);
        if (node) {
          let handler = this._getHandlerForFunction(fn);
          node[methodName](eventName, handler);
        } else {
          console.warn(`No node could be found for the selector '${ selector }'`);
        }
      }
    },

    _getHandlerForFunction(fn) {
      return ev => fn.call(this, ev, ev.detail);
    },

    _getNodeForSelector(selector) {
      switch (selector) {
        case 'window':
          return window;
        case 'document':
          return document;
        case '':
          return this;
        default:
          // When searching for elements with an explicit id set, we already
          // know where to find them b/c Polymer grabbed them at `this.$`.
          if (selector[0] === '#') {
            let id = selector.slice(1);
            return this.$[id];
          }
          // this._nodes holds all the nodes Polymer found annotations on.
          // It is a good candidate to search for b/c it is likely, that an
          // element we want to listen to also has some bindings attached.
          for (let node of this._nodes) {
            if (node.matches(selector)) {
              return node;
            }
          }
          // So querySelector is actually just the known to be slow fallback
          // method.
          return this.$$(selector);
      }
    }

  }, (_applyDecoratedDescriptor(_obj, '_getHandlerForFunction', [memoize], Object.getOwnPropertyDescriptor(_obj, '_getHandlerForFunction'), _obj), _applyDecoratedDescriptor(_obj, '_getNodeForSelector', [memoize], Object.getOwnPropertyDescriptor(_obj, '_getNodeForSelector'), _obj)), _obj);

  const notify = true;
  const readOnly = true;
  const reflect = true;

  const property = decorator(function property(target, name, descriptor, options = {}) {
    let val = descriptor.initializer();
    let newOptions = makeOptions(val, options);

    installProperty(target, name, newOptions);
    descriptor.initializer = () => undefined;
  });

  const attribute = decorator(function attribute(target, name, descriptor, options = {}) {
    let val = descriptor.initializer();
    let newOptions = makeOptions(val, options);
    if (newOptions.reflectToAttribute === undefined) {
      newOptions.reflectToAttribute = true;
    }

    delete descriptor.initializer;
    installProperty(target, name, newOptions);
  });

  /**
   * Declare a computed property. Typically:
   *
   *    @computed('(data)')
   *    processedData: (data) => ...
   *
   * You can pass the usual options as the second argument, like so:
   *
   *    @computed('(value)', {type: Number})
   *    _value: Math.max.bind(null, 1)
   *
   *
   * No vanilla call supported
   */
  const computed = decorator(function computed(target, name, descriptor, trigger, options = {}) {
    let fn = descriptor.value || descriptor.initializer();

    if (!trigger) {
      throw new Error(`Must specify dependencies for the computed ` + `${ target.is }.${ name }.`);
    }
    if (trigger[0] !== '(') {
      throw new Error(`Enclose dependencies in parentheses. ` + `Got '${ options }' for ${ target.is }.${ name }`);
    }

    let propName, computeFnName;
    if (options.name) {
      // @computed({name: 'foo'}) _computeFoo() {}
      propName = options.name;
      computeFnName = name;
    } else {
      [propName, computeFnName] = guessPropertyName(name);
    }

    if (!options.computed) {
      let computedStr = `${ computeFnName }${ trigger }`;
      options.computed = computedStr;
    }

    if (computeFnName !== name) {
      target[computeFnName] = fn;
    }

    installProperty(target, propName, options);
  });

  // Example:
  // @computed.fromEvent('document visibilitychange')
  // visible: (ev) => !document.hidden
  //
  computed.fromEvent = decorator(function computedFromEvent(target, name, descriptor, trigger, options = {}) {

    // First install a readOnly property
    const defaultOptions = { readOnly, value: undefined, type: Object };
    const propOptions = Object.assign({}, defaultOptions, options);
    if (popProp(propOptions, 'reflect')) {
      propOptions.reflectToAttribute = true;
    }
    installProperty(target, name, propOptions);

    // Second install a specific event handler
    const fn = descriptor.value || descriptor.initializer();
    const handler = function (ev) {
      this.__setProperty(name, fn(ev));
    };

    // Should we do this?
    descriptor.value = handler;

    installEventHandler(target, trigger, handler);
  });

  function guessPropertyName(fnName) {
    // 'foo' => ['foo', '__compute_foo__']
    // '_computeFooBar' => ['fooBar', '_computeFooBar']

    let propName, computeFnName;
    let matches = fnName.match(/(?:_)?compute(.+)/);
    if (matches) {
      propName = downcase(matches[1]);
      computeFnName = fnName;
    } else {
      propName = fnName;
      computeFnName = `__compute_${ propName }__`;
    }
    return [propName, computeFnName];
  }

  function makeOptions(val, options) {
    let [type, value] = extractTypeAndValue(val, options);

    return {
      type, value,
      notify: options.notify,
      reflectToAttribute: options.reflect || options.reflectToAttribute,
      computed: options.computed,
      observer: options.observer,
      readOnly: options.readOnly
    };
  }

  function extractTypeAndValue(val, options) {
    if (options.default) {
      return [val, options.default];
    }
    if (options.value) {
      return [val, options.value];
    }
    if (options.type) {
      return [options.type, val];
    }
    return guessTypeAndValue(val);
  }

  function guessTypeAndValue(val) {
    let type;
    switch (val) {
      case String:
      case Number:
      case Boolean:
      case Function:
      case Array:
      case Object:
        type = val;
        return [type, undefined];
    }

    switch (typeof val) {
      case 'string':
        return [String, val];
      case 'number':
        return [Number, val];
      case 'boolean':
        return [Boolean, val];
      case 'function':
        return [Function, val];
    }

    if (Array.isArray(val)) {
      return [Array, () => []];
    }

    return [Object, () => ({})];
  }

  function name(tagName) {
    return function decorator(target) {
      target.is = tagName;
    };
  }

  function mixin(...behaviors) {
    return function decorator(target) {
      if (!target.behaviors) {
        target.behaviors = [];
      }
      target.behaviors.push(...behaviors);
    };
  }

  function extend(tagName) {
    return function decorator(target) {
      target.extends = tagName;
    };
  }

  function nonVisual(target) {
    if (!target.hostAttributes) {
      target.hostAttributes = {};
    }

    if (target.hostAttributes.hidden === undefined) {
      target.hostAttributes.hidden = true;
    }

    if (target._template === undefined) {
      target._template = null;
    }
  }

  /**
   * Ensure that a property is set (or not set), and thus invoke the
   * decorated method conditionally.
   *
   *    @ensure('collapsed')
   *    _doSomething() { ... }
   *
   * which is the same as writing `if (!this.collapsed) { return; }` as the
   * first line of the method.
   *
   * Negate the test by prefixing it with an '!'
   *
   *    @ensure('!expanded')
   *    _doSomething() { ... }
   *
   *
   * No vanilla call possible.
   *
   */
  const ensure = decorator(function ensure(target, fnName, descriptor, attribute) {
    let fn = descriptor.value;
    let not = attribute[0] === '!';
    if (not) {
      attribute = attribute.slice(1);
    }
    descriptor.value = function (...args) {
      let value = Boolean(this[attribute]);
      if (not) {
        value = !value;
      }
      if (value) {
        fn.apply(this, args);
      }
    };
  });

  const ensureAll = decorator(function ensureAll(target, fnName, descriptor, pred = Boolean, { otherwise } = { otherwise: null }) {
    let fn = descriptor.value || descriptor.initializer();
    descriptor.value = function (...args) {
      if (args.every(pred)) {
        return fn.apply(this, args);
      }
      return otherwise;
    };
  });

  function withGuarded(element, name, fn) {
    let effects = element.__disabledSideEffects__;
    effects.push(name);
    try {
      fn();
    } finally {
      removeFromArray(effects, name);
    }
  }

  function removeFromArray(ary, item) {
    let idx = ary.indexOf(item);
    if (idx !== -1) {
      ary.splice(idx, 1);
    }
  }

  const GuardedSideEffects = {
    created() {
      this.__disabledSideEffects__ = [];
    },

    guard(name, fn) {
      withGuarded(this, name, fn);
    }
  };

  const FX = decorator(function FX(target, name, descriptor, effectName) {
    ensureBehavior(target, GuardedSideEffects);
    let fn = descriptor.value;
    name = effectName || name;
    descriptor.value = function (...args) {
      if (this.__disabledSideEffects__.indexOf(name) === -1) {
        fn.call(this, ...args);
      }
    };
  });

  const guard = decorator(function guard(target, name, descriptor, effectName) {
    ensureBehavior(target, GuardedSideEffects);
    let fn = descriptor.value;
    descriptor.value = function (...args) {
      this.guard(effectName, () => fn.apply(this, args));
    };
  });

  exports.decorator = decorator;
  exports.log = log;
  exports.perf = perf;
  exports.observer = observer;
  exports.asyncObserver = asyncObserver;
  exports.property = property;
  exports.attribute = attribute;
  exports.computed = computed;
  exports.notify = notify;
  exports.readOnly = readOnly;
  exports.reflect = reflect;
  exports.name = name;
  exports.mixin = mixin;
  exports.extend = extend;
  exports.nonVisual = nonVisual;
  exports.debounce = debounce;
  exports.throttle = throttle;
  exports.cancelsDebouncer = cancelsDebouncer;
  exports.async = async;
  exports.ensure = ensure;
  exports.ensureAll = ensureAll;
  exports.on = on;
  exports.FX = FX;
  exports.guard = guard;

}((this.Pony.decorators = this.Pony.decorators || {})));