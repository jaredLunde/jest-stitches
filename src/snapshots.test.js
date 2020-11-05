import React from 'react'
import ReactDOM from 'react-dom'
import prettyFormat from 'pretty-format'
import {createComponent, renderJson} from 'test-utils'
import serializer, {createSerializer} from 'index'

expect.addSnapshotSerializer(serializer)
afterEach(() => {
  document.getElementsByTagName('html')[0].innerHTML = ''
})

let stitchesPlugin = createSerializer()

const {ReactElement, ReactTestComponent, DOMElement} = prettyFormat.plugins

describe('jest-stitches with dom elements', () => {
  it('inserts styles into React test component snapshots', () => {
    const tree = renderJson(createComponent())

    const output = prettyFormat(tree, {
      plugins: [stitchesPlugin, ReactElement, ReactTestComponent, DOMElement],
    })

    expect(output).toMatchSnapshot()
  })

  it('inserts styles into DOM element snapshots', () => {
    const divRef = React.createRef()

    ReactDOM.render(
      React.cloneElement(createComponent(), {ref: divRef}),
      document.createElement('div')
    )

    const output = prettyFormat(divRef.current, {
      plugins: [stitchesPlugin, ReactElement, ReactTestComponent, DOMElement],
    })

    expect(output).toMatchSnapshot()
  })
})

describe('@stitches/react with DOM elements disabled', () => {
  const stitchesPlugin = createSerializer({DOMElements: false})

  it('inserts styles into React test component snapshots', () => {
    const tree = renderJson(createComponent())

    const output = prettyFormat(tree, {
      plugins: [stitchesPlugin, ReactElement, ReactTestComponent, DOMElement],
    })

    expect(output).toMatchSnapshot()
  })

  it('does not insert styles into DOM element snapshots', () => {
    const divRef = React.createRef()

    ReactDOM.render(
      React.cloneElement(createComponent(), {ref: divRef}),
      document.createElement('div')
    )

    const output = prettyFormat(divRef.current, {
      plugins: [stitchesPlugin, ReactElement, ReactTestComponent, DOMElement],
    })

    expect(output).toMatchSnapshot()
  })
})
