import { render } from './renderer'
import { createVNode } from './vnode'

export function createApp(rootComponent: any) {
  return {
    mount(rootContainer: any) {
      // 转化成 vnode
      // 对 vnode 进行处理
      const vnode = createVNode(rootComponent)

      // 进行 render 操作
      render(vnode, transformRootContainer(rootContainer))
    },
  }
}

function transformRootContainer(rootContainer: any) {
  if (typeof rootContainer === 'string')
    return document.querySelector(rootContainer)

  return rootContainer
}
