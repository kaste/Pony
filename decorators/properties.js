
import decorator from './decorator'
import {installProperty} from './helpers'
import {installEventHandler} from './events'
import {popProp, downcase} from './funcs'


export const notify = true
export const readOnly = true
export const reflect = true


/**
 * Declare a normal Polymer property. Usually:
 *
 *    @property
 *    width: 1024  // infer the type Number
 *
 *    @property({notify, readOnly})
 *    data: []    // infer the type Array,
 *                // the default value is a new empty Array
 *
 *    @property
 *    active: Boolean  // the initial value is `undefined`
 *
 * If in doubt, declare either `default` (AKA `value`) or `type` in the
 * options. Like so:
 *
 *    @property({type: Array})
 *    data: () => ['Sarah', 'Tom']
 *
 * Or vice versa:
 *
 *    @property({default: true})
 *    maximize: Boolean
 *
 * Note: If you want to specify a property observer, use `@observer` and
 * not the options here. If you want a `computed` use `@computed`. If you
 * want an attribute via `options.reflectToAttribute` use `@attribute`.
 *
 */
export const property = decorator(
    function property(target, name, descriptor, options={}) {
  let val = descriptor.initializer()
  let newOptions = makeOptions(val, options)

  installProperty(target, name, newOptions)
  descriptor.initializer = () => undefined
})


/**
 * Declare an attribute, which is a Polymer property which reflects
 *
 *    @attribute
 *    visible: Boolean
 *
 * Etcetera, can get the same options as its first argument as the
 * @property decorator.
 */
export const attribute = decorator(
    function attribute(target, name, descriptor, options={}) {
  let val = descriptor.initializer()
  let newOptions = makeOptions(val, options)
  if (newOptions.reflectToAttribute === undefined) {
    newOptions.reflectToAttribute = true
  }

  delete descriptor.initializer
  installProperty(target, name, newOptions)
})



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
export const computed = decorator(
    function computed(target, name, descriptor, trigger, options={}) {
  let fn = descriptor.value || descriptor.initializer()

  if (!trigger) {
    throw new Error(`Must specify dependencies for the computed ` +
                    `${target.is}.${name}.`)
  }
  if (trigger[0] !== '(') {
    throw new Error(`Enclose dependencies in parentheses. ` +
                    `Got '${options}' for ${target.is}.${name}`)
  }

  let propName, computeFnName
  if (options.name) {
    // @computed({name: 'foo'}) _computeFoo() {}
    propName = options.name
    computeFnName = name
  } else {
    [propName, computeFnName] = guessPropertyName(name)
  }

  if (!options.computed) {
    let computedStr = `${computeFnName}${trigger}`
    options.computed = computedStr
  }

  if (computeFnName !== name) {
    target[computeFnName] = fn
  }

  installProperty(target, propName, options)
})


/**
 * Declare a computed property which depends on a DOM event
 *
 *    @computed.fromEvent('document visibilitychange')
 *    visible: (ev) => !document.hidden
 *
 *    @computed.fromEvent('window resize')
 *    @debounce({ms: 100})   // <- probably a good idea
 *    width() { return this.offsetWidth }
 *
 */

computed.fromEvent = decorator(
    function computedFromEvent(target, name, descriptor, trigger, options={}) {

  // First install a readOnly property
  const defaultOptions = {readOnly, value: undefined, type: Object}
  const propOptions = Object.assign({}, defaultOptions, options)
  if (popProp(propOptions, 'reflect')) {
    propOptions.reflectToAttribute = true
  }
  installProperty(target, name, propOptions)


  // Second install a specific event handler
  const fn = descriptor.value || descriptor.initializer()
  const handler = function(ev) {
    this.__setProperty(name, fn(ev))
  }

  // Should we do this?
  descriptor.value = handler

  installEventHandler(target, trigger, handler)
})


function guessPropertyName(fnName) {
  // 'foo' => ['foo', '__compute_foo__']
  // '_computeFooBar' => ['fooBar', '_computeFooBar']

  let propName, computeFnName
  let matches = fnName.match(/(?:_)?compute(.+)/)
  if (matches) {
    propName = downcase(matches[1])
    computeFnName = fnName
  } else {
    propName = fnName
    computeFnName = `__compute_${propName}__`
  }
  return [propName, computeFnName]
}


function makeOptions(val, options) {
  let [type, value] = extractTypeAndValue(val, options)

  return {
    type, value,
    notify: options.notify,
    reflectToAttribute: options.reflect || options.reflectToAttribute,
    computed: options.computed,
    observer: options.observer,
    readOnly: options.readOnly
  }
}

function extractTypeAndValue(val, options) {
  if (options.default) {
    return [val, options.default]
  }
  if (options.value) {
    return [val, options.value]
  }
  if (options.type) {
    return [options.type, val]
  }
  return guessTypeAndValue(val)
}

function guessTypeAndValue(val) {
  let type
  switch (val) {
    case String:
    case Number:
    case Boolean:
    case Function:
    case Array:
    case Object:
      type = val
      return [type, undefined]
  }

  switch (typeof val) {
    case 'string':
      return [String, val]
    case 'number':
      return [Number, val]
    case 'boolean':
      return [Boolean, val]
    case 'function':
      return [Function, val]
  }

  if (Array.isArray(val)) {
    return [Array, () => []]
  }

  return [Object, () => ({})]
}

