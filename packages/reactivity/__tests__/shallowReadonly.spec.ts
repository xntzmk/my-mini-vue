import { isReadonly, shallowReadonly } from '../src/reactive'

describe('shallowReadonly', () => {
  it('should not make non-reactive properties reactive', () => {
    const props = shallowReadonly({ n: { foo: 1 } })

    expect(isReadonly(props)).toBe(true)
    expect(isReadonly(props.n)).toBe(false)
  })

  it('warn when call set', () => {
    console.warn = vi.fn()

    const user = shallowReadonly({
      name: '111',
    })

    user.name = '222'
    expect(console.warn).toBeCalled()
  })
})
