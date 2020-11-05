<hr>
  <h1>jest-stitches</h1>
  <br/>
  <blockquote>Jest utilities for <a href="https://stitches.dev">Stitches</a></blockquote>
  
  <pre>npm i -D jest-stitches</pre>
  <br/>
  <a aria-label="Code coverage report" href="https://codecov.io/gh/jaredLunde/jest-stitches">
    <img alt="Code coverage" src="https://img.shields.io/codecov/c/gh/jaredLunde/jest-stitches?style=for-the-badge&labelColor=24292e">
  </a>
  <a aria-label="Build status" href="https://travis-ci.com/jaredLunde/jest-stitches">
    <img alt="Build status" src="https://img.shields.io/travis/com/jaredLunde/jest-stitches?style=for-the-badge&labelColor=24292e">
  </a>
  <a aria-label="NPM version" href="https://www.npmjs.com/package/jest-stitches">
    <img alt="NPM Version" src="https://img.shields.io/npm/v/jest-stitches?style=for-the-badge&labelColor=24292e">
  </a>
  <a aria-label="License" href="https://jaredlunde.mit-license.org/">
    <img alt="MIT License" src="https://img.shields.io/npm/l/jest-stitches?style=for-the-badge&labelColor=24292e">
  </a>

<hr>

## Stitches snapshots

The easiest way to test React, Preact, and Preact X components with [Stitches](https://stitches.dev) is using the snapshot serializer. You can register the serializer via the `snapshotSerializers` configuration property in your jest configuration like so:

```js
// jest.config.js
module.exports = {
  // ... other config
  snapshotSerializers: ['jest-stitches'],
}
```

Or you can customize the serializer via the `createSerializer` method like so: (the example below is with react-test-renderer but `jest-stitches` also works with enzyme and react-testing-library)

```jsx harmony
import React from 'react'
import renderer from 'react-test-renderer'
import {createStyled} from '@stitches/react'
import serializer from 'jest-stitches'

const {styled, css} = createStyled({})

expect.addSnapshotSerializer(serializer)

afterEach(() => {
  css.dispose()
})

test('renders with correct styles', () => {
  const Button = styled('button', {
    variants: {
      blue: {
        backgroundColor: 'blue',
      },
    },
  })

  const tree = renderer.create(<Button>Hello world</Button>).toJSON()

  expect(tree).toMatchSnapshot()
})
```

### Options

#### `classNameReplacer`

`jest-stitches`'s snapshot serializer replaces the hashes in class names with an index so that things like whitespace changes won't break snapshots. It optionally accepts a custom class name replacer, it defaults to the below.

```jsx harmony
const classNameReplacer = (className, index) => `ui-${index}`
```

```jsx harmony
import {createSerializer} from 'jest-stitches'

expect.addSnapshotSerializer(
  createSerializer({
    classNameReplacer(className, index) {
      return `my-new-class-name-${index}`
    },
  })
)
```

#### `DOMElements`

`jest-stitches`'s snapshot serializer inserts styles and replaces class names in both React and DOM elements. If you would like to disable this behavior for DOM elements, you can do so by passing `{ DOMElements: false }`. For example:

```jsx
import {createSerializer} from 'jest-stitches'

// configures jest-stitches to ignore DOM elements
expect.addSnapshotSerializer(createSerializer({DOMElements: false}))
```

## Custom assertions

### toHaveStyleRule

To make more explicit assertions when testing your components you can use the `toHaveStyleRule` matcher.

```jsx harmony
import React from 'react'
import renderer from 'react-test-renderer'
import {createStyled} from '@stitches/react'
import {matchers} from 'jest-stitches'

const {styled, css} = createStyled({})
// Add the custom matchers provided by 'jest-stitches'
expect.extend(matchers)

afterEach(() => {
  css.dispose()
})

test('renders with correct styles', () => {
  const Button = styled('button', {
    variants: {
      blue: {
        backgroundColor: 'blue',
      },
    },
  })

  const tree = renderer.create(<Button>Hello world</Button>).toJSON()

  expect(tree).toHaveStyleRule('background-color', 'blue')
  expect(tree).not.toHaveStyleRule('background-color', 'hotpink')
})
```

## Credit

This was inspired by and relies almost entirely on work by [jest-emotion](https://github.com/emotion-js/emotion/tree/master/packages/jest-emotion)
which was largely inspired by [jest-glamor-react](https://github.com/kentcdodds/jest-glamor-react).

## LICENSE

MIT
