
import decorator from './decorator'
import {memoize1 as memoize} from './basics'
import {ensureBehavior} from './helpers'
import {splitAtLastChar} from './funcs'


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
export const on = decorator(
    function on(target, fnName, descriptor, eventDescription) {

  let fn = descriptor.value
  installEventHandler(target, eventDescription, fn)
})

export function installEventHandler(target, trigger, fn) {
  ensureBehavior(target, InstallEventListeners)

  const [selector, eventName] = splitAtLastChar(trigger, ' ')
  addListenerInfo(target, {selector, eventName, fn})
}



function addListenerInfo(target, description) {
  if (!target.__listenerInfos) {
    target.__listenerInfos = []
  }
  target.__listenerInfos.push(description)
}

const InstallEventListeners = {

  attached() {
    this._addRemoveListeners(this.__listenerInfos, 'addEventListener')
  },

  detached() {
    this._addRemoveListeners(this.__listenerInfos, 'removeEventListener')
  },

  _addRemoveListeners(listenerInfos, methodName) {
    for (let {eventName, selector, fn} of listenerInfos) {
      let node = this._getNodeForSelector(selector)
      if (node) {
        let handler = this._getHandlerForFunction(fn)
        node[methodName](eventName, handler)
      } else {
        console.warn(
          `No node could be found for the selector '${selector}'`)
      }
    }
  },

  @memoize
  _getHandlerForFunction(fn) {
    return (ev) => fn.call(this, ev, ev.detail)
  },


  @memoize
  _getNodeForSelector(selector) {
    switch (selector) {
      case 'window':
        return window
      case 'document':
        return document
      case '':
        return this
      default:
        // When searching for elements with an explicit id set, we already
        // know where to find them b/c Polymer grabbed them at `this.$`.
        if (selector[0] === '#') {
          let id = selector.slice(1)
          return this.$[id]
        }
        // this._nodes holds all the nodes Polymer found annotations on.
        // It is a good candidate to search for b/c it is likely, that an
        // element we want to listen to also has some bindings attached.
        for (let node of this._nodes) {
          if (node.matches(selector)) {
            return node
          }
        }
        // So querySelector is actually just the known to be slow fallback
        // method.
        return this.$$(selector)
    }
  }

}


