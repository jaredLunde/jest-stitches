import * as React from 'react'
import {createStyled} from '@stitches/react'
import renderer from 'react-test-renderer'
import * as Enzyme from 'enzyme'
import Adapter from 'enzyme-adapter-react-16'

Enzyme.configure({adapter: new Adapter()})

export const renderJson = (children) => renderer.create(children).toJSON()

export function createComponent(props, svgProps) {
  const {styled} = createStyled({})
  const Button = styled.button({
    backgroundColor: 'blue',
    ...props,
  })

  const Svg = styled.svg({
    color: 'yellow',
    ...svgProps,
  })

  return (
    <Button>
      <Svg />
    </Button>
  )
}
