
import decorator from './decorator'


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
export const debounce = decorator(
    function debounce(target, fnName, descriptor,
                      {ms=0, name=fnName, reassign=true}={}) {

  let fn = descriptor.value
  descriptor.value = function(...args) {
    if (reassign || !this.isDebouncerActive(name)) {
      let callback = () => fn.apply(this, args)
      this.debounce(name, callback, ms)
    } else {
      let debouncer = this._debouncers[name]
      this.debounce(name, debouncer.callback, ms)
    }
  }
})

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
export const throttle = decorator(
    function throttle(target, fnName, descriptor,
                      {ms=0, name=fnName, reassign=true}={}) {
  let fn = descriptor.value
  descriptor.value = function(...args) {
    if (!this.isDebouncerActive(name)) {
      let callback = () => fn.apply(this, args)
      this.debounce(name, callback, ms)
    } else if (reassign) {
      let callback = () => fn.apply(this, args)
      let debouncer = this._debouncers[name]
      debouncer.callback = callback
    }
  }
})

/**
 * Cancels the debouncer with the given name.
 *
 * No vanilla call is supported.
 *
 *    @cancelsDebouncer('_clickHandler')
 *    _tapHandler(ev) { ... }
 *
 */
export const cancelsDebouncer = decorator(
    function cancelsDebouncer(target, fnName, descriptor, jobName) {
  let fn = descriptor.value
  descriptor.value = function(...args) {
    this.cancelDebouncer(jobName)
    return fn.apply(this, args)
  }
})

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
export const async = decorator(
    function async(target, fnName, descriptor, {ms=0}={}) {
  let fn = descriptor.value
  descriptor.value = function(...args) {
    let callback = () => fn.apply(this, args)
    this.async(callback, ms)
  }
})
