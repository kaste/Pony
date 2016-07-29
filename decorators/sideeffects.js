
import decorator from './decorator'
import {ensureBehavior} from './helpers'


/**
 * Give the side-effects of a function call a specific name.
 *
 * Use `@FX` with the `@guard` or `this.guard` to disable specific
 * side-effects temporarily.
 *
 *    @observer('value')
 *    @FX('save')
 *    valueChanged(val) {
 *      this.service.save(val)
 *    }
 *
 *    @on('#service load')
 *    @guard('save')
 *    _receiveValFromService(val) {
 *      this.value = val
 *    }
 *
 */
export const FX = decorator(
    function FX(target, name, descriptor, effectName=name) {
  ensureBehavior(target, GuardedSideEffects)
  let fn = descriptor.value
  descriptor.value = function(...args) {
    if (this.__disabledSideEffects__.indexOf(effectName) === -1) {
      fn.apply(this, args)
    }
  }
})

/**
 * Disable the given side-effect during execution of this function.
 * See @FX
 *
 */
export const guard = decorator(
    function guard(target, name, descriptor, effectName) {
  ensureBehavior(target, GuardedSideEffects)
  let fn = descriptor.value
  descriptor.value = function(...args) {
    this.guard(effectName, () => fn.apply(this, args))
  }
})


export const GuardedSideEffects = {
  created() {
    this.__disabledSideEffects__ = []
  },

  guard(name, fn) {
    withGuarded(this, name, fn)
  }
}

function withGuarded(element, name, fn) {
  let effects = element.__disabledSideEffects__
  effects.push(name)
  try {
    fn()
  } finally {
    removeFromArray(effects, name)
  }
}

function removeFromArray(ary, item) {
  let idx = ary.indexOf(item)
  if (idx !== -1) {
      ary.splice(idx, 1)
  }
}
