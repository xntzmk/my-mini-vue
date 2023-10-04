import { h } from '../../dist/xntzmk-mini-vue.esm.js'

export const Foo = {
  setup(props) {
    // 1. 获取 props
    console.log(props)

    // 3. 不允许修改 props (readonly)
    props.name = '333'
  },
  render() {
    return h(
      'div',
      {
        id: 'foo',
      },
      // 2. 访问 props
      `foo: ${this.name}`,
    )
  },
}
