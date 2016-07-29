

export function name(tagName) {
  return function decorator(target) {
    target.is = tagName
  }
}

export function mixin(...behaviors) {
  return function decorator(target) {
    if (!target.behaviors) {
      target.behaviors = []
    }
    target.behaviors.push(...behaviors)
  }
}

export function extend(tagName) {
  return function decorator(target) {
    target.extends = tagName
  }
}

/**
 * Mark an element as non-visual.
 *
 * Currently this automatically hides the element, and disabled
 * the templating stuff.
 *
 */

export function nonVisual(target) {
  if (!target.hostAttributes) {
    target.hostAttributes = {}
  }

  if (target.hostAttributes.hidden === undefined) {
    target.hostAttributes.hidden = true
  }

  if (target._template === undefined) {
    target._template = null
  }
}