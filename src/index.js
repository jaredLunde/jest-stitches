/**
 * A style serializer for Stiches. Hopefully we can replace this with
 * an official one in the future.
 */
import * as css from 'css'
import chalk from 'chalk'

//
// Utils
const flatMap = (arr, iteratee) => [].concat(...arr.map(iteratee))

export const RULE_TYPES = {
  media: 'media',
  rule: 'rule',
}

const getClassNames = (selectors, classes) => {
  return classes ? selectors.concat(classes.split(' ')) : selectors
}

const getClassNamesFromTestRenderer = (selectors, {props}) =>
  getClassNames(
    selectors,
    props ? (props.className || props.class || '').toString() : null
  )

const shouldDive = (node) =>
  typeof node.dive === 'function' && typeof node.type() !== 'string'

const isTagWithClassName = (node) =>
  node.prop('className') && typeof node.type() === 'string'

const getClassNamesFromEnzyme = (selectors, node) => {
  // We need to dive if we have selected a styled child from a shallow render
  const actualComponent = shouldDive(node) ? node.dive() : node
  // Find the first node with a className prop
  const components = actualComponent.findWhere(isTagWithClassName)
  const classes =
    components.length && components.first().prop('className')
      ? components.first().prop('className').toString()
      : components.first().prop('className')

  return getClassNames(selectors, classes)
}

const getClassNamesFromCheerio = (selectors, node) => {
  const classes = node.attr('class')
  return getClassNames(selectors, classes)
}

const getClassNamesFromDOMElement = (selectors, node) =>
  getClassNames(selectors, node.getAttribute('class'))

export const isReactElement = (val) => {
  if (val.$$typeof === Symbol.for('react.test.json')) {
    return true
  } else if (
    val.hasOwnProperty('props') &&
    val.hasOwnProperty('type') &&
    val.hasOwnProperty('ref') &&
    val.hasOwnProperty('key')
  ) {
    // Preact X
    try {
      val.$$typeof = Symbol.for('react.test.json')
      // eslint-disable-next-line no-empty
    } catch (err) {}
    return true
  }
}

const domElementPattern = /^((HTML|SVG)\w*)?Element$/

export const isDOMElement = (val) =>
  val.nodeType === 1 &&
  val.constructor &&
  val.constructor.name &&
  domElementPattern.test(val.constructor.name)

const isEnzymeElement = (val) => typeof val.findWhere === 'function'
const isCheerioElement = (val) => val.cheerio === '[cheerio object]'

export const getClassNamesFromNodes = (nodes) =>
  nodes.reduce((selectors, node) => {
    if (isReactElement(node)) {
      return getClassNamesFromTestRenderer(selectors, node)
    } else if (isEnzymeElement(node)) {
      return getClassNamesFromEnzyme(selectors, node)
    } else if (isCheerioElement(node)) {
      return getClassNamesFromCheerio(selectors, node)
    }

    return getClassNamesFromDOMElement(selectors, node)
  }, [])

let keyframesPattern = /^@keyframes\s+(animation-[^{\s]+)+/

let removeCommentPattern = /\/\*[\s\S]*?\*\//g

const getElementRules = (element) => {
  const nonSpeedyRule = element.textContent
  if (nonSpeedyRule) {
    return [nonSpeedyRule]
  }
  if (!element.sheet) {
    return []
  }
  // $FlowFixMe - flow doesn't know about `cssRules` property
  return [].slice.call(element.sheet.cssRules).map((cssRule) => cssRule.cssText)
}

export const getStylesFromClassNames = (classNames, elements) => {
  if (!classNames.length) {
    return ''
  }

  let selectorPattern = new RegExp('\\.(' + classNames.join('|') + ')')
  let keyframes = {}
  let styles = ''

  flatMap(elements, getElementRules).forEach((rule) => {
    if (selectorPattern.test(rule)) {
      styles += rule
    }
    let match = rule.match(keyframesPattern)
    if (match !== null) {
      let name = match[1]
      if (keyframes[name] === undefined) {
        keyframes[name] = ''
      }
      keyframes[name] += rule
    }
  })
  let keyframeNameKeys = Object.keys(keyframes)
  let keyframesStyles = ''

  if (keyframeNameKeys.length) {
    let keyframesNamePattern = new RegExp(keyframeNameKeys.join('|'), 'g')
    let keyframesNameCache = {}
    let index = 0

    styles = styles.replace(keyframesNamePattern, (name) => {
      if (keyframesNameCache[name] === undefined) {
        keyframesNameCache[name] = `animation-${index++}`
        keyframesStyles += keyframes[name]
      }
      return keyframesNameCache[name]
    })

    keyframesStyles = keyframesStyles.replace(keyframesNamePattern, (value) => {
      return keyframesNameCache[value]
    })
  }

  return (keyframesStyles + styles).replace(removeCommentPattern, '')
}

export const getStyleElements = () =>
  Array.from(document.querySelectorAll('style'))

let unique = (arr) => Array.from(new Set(arr))

export const getKeys = (elements) => unique(elements.filter(Boolean))

export const hasClassNames = (classNames, selectors, target) =>
  selectors.some((selector) => {
    // if no target, use className of the specific css rule and try to find it
    // in the list of received node classNames to make sure this css rule
    // applied for root element
    if (!target) {
      return classNames.includes(selector.slice(1))
    }

    // check if selector (className) of specific css rule match target
    return target instanceof RegExp
      ? target.test(selector)
      : minify(selector).includes(minify(target))
  })

export const getMediaRules = (rules, media) =>
  rules
    .filter((rule) => {
      const isMediaMatch = rule.media
        ? rule.media.replace(/\s/g, '').includes(media.replace(/\s/g, ''))
        : false
      return rule.type === RULE_TYPES.media && isMediaMatch
    })
    .reduce((mediaRules, mediaRule) => mediaRules.concat(mediaRule.rules), [])

//
// Matchers
/*
 * Taken from
 * https://github.com/facebook/jest/blob/be4bec387d90ac8d6a7596be88bf8e4994bc3ed9/packages/expect/src/jasmine_utils.js#L234
 */
const isA = (typeName, value) =>
  Object.prototype.toString.apply(value) === `[object ${typeName}]`

/*
 * Taken from
 * https://github.com/facebook/jest/blob/be4bec387d90ac8d6a7596be88bf8e4994bc3ed9/packages/expect/src/jasmine_utils.js#L36
 */
const isAsymmetric = (obj) => obj && isA('Function', obj.asymmetricMatch)

const valueMatches = (declaration, value) => {
  if (value instanceof RegExp) {
    return value.test(declaration.value)
  }

  if (isAsymmetric(value)) {
    return value.asymmetricMatch(declaration.value)
  }

  return minify(value) === minify(declaration.value)
}

const minLeft = /([:;,([{}>~/\s]|\/\*)\s+/g
const minRight = /\s+([:;,)\]{}>~/!]|\*\/)/g
const minify = (s) => s.trim().replace(minLeft, '$1').replace(minRight, '$1')

const toHaveStyleRule = (received, property, value, options = {}) => {
  const {target, media} = options
  const classNames = getClassNamesFromNodes([received])
  const cssString = getStylesFromClassNames(classNames, getStyleElements())
  const styles = css.parse(cssString)
  let preparedRules = styles.stylesheet.rules
  if (media) {
    preparedRules = getMediaRules(preparedRules, media)
  }

  const declaration = preparedRules
    .filter(
      (rule) =>
        rule.type === RULE_TYPES.rule &&
        hasClassNames(classNames, rule.selectors, target)
    )
    .reduce((decs, rule) => decs.concat(rule.declarations), [])
    .filter(
      (dec) =>
        dec.type === 'declaration' && minify(dec.property) === minify(property)
    )
    .pop()

  if (!declaration) {
    return {
      pass: false,
      message: () => `Property not found: ${property}`,
    }
  }

  const pass = valueMatches(declaration, value)

  const message = () =>
    `Expected ${property}${pass ? ' not ' : ' '}to match:\n` +
    `  ${chalk.green(value)}\n` +
    'Received:\n' +
    `  ${chalk.red(declaration.value)}`

  return {
    pass,
    message,
  }
}

export const matchers = {toHaveStyleRule}

//
// Pretty serialization
const componentSelectorClassNamePattern = /^e[a-zA-Z0-9]+[0-9]+$/
export const replaceClassNames = (classNames, styles, code) => {
  return classNames.reduce((acc, className) => {
    if (componentSelectorClassNamePattern.test(className)) {
      return acc
    }
    return acc
  }, `${styles}${styles ? '\n\n' : ''}${code}`)
}

const getNodes = (node, nodes = []) => {
  if (Array.isArray(node)) {
    for (let child of node) {
      getNodes(child, nodes)
    }
    return nodes
  }

  let children = node.children || (node.props && node.props.children)

  if (children) {
    // fix for Preact X
    children = node.props
      ? Array.isArray(children)
        ? children
        : [children]
      : children

    for (let child of children) {
      getNodes(child, nodes)
    }
  }

  if (typeof node === 'object') {
    nodes.push(node)
  }

  return nodes
}

const getPrettyStylesFromClassNames = (classNames, elements) => {
  let styles = getStylesFromClassNames(classNames, elements)

  let prettyStyles

  try {
    prettyStyles = css.stringify(css.parse(styles))
  } catch (e) {
    console.error(e)
    throw new Error(`There was an error parsing the following css: "${styles}"`)
  }

  return prettyStyles
}

export const createSerializer = (opt = {}) => {
  let {DOMElements = true} = opt
  let cache = new WeakSet()

  return {
    test(val) {
      return (
        val &&
        !cache.has(val) &&
        (isReactElement(val) || (DOMElements && isDOMElement(val)))
      )
    },

    print(val, printer) {
      const nodes = getNodes(val)
      const classNames = getClassNamesFromNodes(nodes)
      let elements = getStyleElements()
      const styles = getPrettyStylesFromClassNames(classNames, elements)
      nodes.forEach(cache.add, cache)
      const printedVal = printer(val)
      nodes.forEach(cache.delete, cache)
      let keys = getKeys(elements)
      return replaceClassNames(classNames, styles, printedVal, keys)
    },
  }
}

export const {print, test} = createSerializer()
export default {print, test}
