import * as enzyme from 'enzyme'
import {renderJson, createComponent} from 'test-utils'
import {matchers} from 'index'

const {toHaveStyleRule} = matchers
expect.extend(matchers)
afterEach(() => {
  document.getElementsByTagName('html')[0].innerHTML = ''
})

describe('toHaveStyleRule', () => {
  const enzymeMethods = ['mount', 'render']

  it('matches styles on the top-most node passed in', () => {
    const tree = renderJson(createComponent())

    expect(tree).toHaveStyleRule('background-color', 'blue')
    expect(tree).not.toHaveStyleRule('width', '100%')
  })

  it('supports asymmetric matchers', () => {
    const tree = renderJson(createComponent({}, {width: '100%'}))
    expect(tree).toHaveStyleRule('background-color', expect.anything())
    expect(tree).not.toHaveStyleRule('padding', expect.anything())

    const svgNode = tree.children[0]
    expect(svgNode).toHaveStyleRule('width', expect.stringMatching(/.*%$/))
  })

  it('supports enzyme render methods', () => {
    enzymeMethods.forEach((method) => {
      const wrapper = enzyme[method](
        createComponent({color: 'red'}, {width: '100%'})
      )
      expect(wrapper).toHaveStyleRule('color', 'red')
      expect(wrapper).not.toHaveStyleRule('width', '100%')
      const svgNode = wrapper.find('svg')
      expect(svgNode).toHaveStyleRule('width', '100%')
      expect(svgNode).not.toHaveStyleRule('color', 'red')
    })
  })

  it('fails if no styles are found', () => {
    const tree = renderJson(createComponent())
    const result = toHaveStyleRule(tree, 'color', 'red')
    expect(result.pass).toBe(false)
    expect(result.message()).toBe('Property not found: color')
  })

  it('supports regex values', () => {
    const tree = renderJson(createComponent({color: 'red'}))
    expect(tree).toHaveStyleRule('color', /red/)
  })

  it('matches styles on the focus, hover targets', () => {
    const tree = renderJson(
      createComponent({
        color: 'white',

        '&:hover': {
          color: 'yellow',
        },

        '&:focus': {
          color: 'black',
        },
      })
    )
    expect(tree).toHaveStyleRule('color', 'yellow', {target: ':hover'})
    expect(tree).toHaveStyleRule('color', 'black', {target: ':focus'})
    expect(tree).toHaveStyleRule('color', 'white')
  })

  it('matches target styles by regex', () => {
    const tree = renderJson(createComponent({svg: {color: 'yellow'}}))
    expect(tree).toHaveStyleRule('color', 'yellow', {target: /svg$/})
  })

  it('matches styles with target and media options', () => {
    const tree = renderJson(
      createComponent({
        color: 'white',
        '@media (min-width: 420px)': {
          color: 'green',
          '&:hover': {
            color: 'yellow',
          },
        },
      })
    )

    expect(tree).toHaveStyleRule('color', 'yellow', {
      target: ':hover',
      media: '(min-width: 420px)',
    })
    expect(tree).toHaveStyleRule('color', 'green', {
      media: '(min-width: 420px)',
    })
    expect(tree).toHaveStyleRule('color', 'white')
  })
})
