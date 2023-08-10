import { isObject } from '../shared'
import { createComponentInstance, setupComponent } from './component'

export function render(vnode: any, container: any) {
  // render 里只做 patch
  patch(vnode, container)
}

// 根据 vnode 的类型进行 组件/元素 的处理
function patch(vnode: any, container: any) {
  if (typeof vnode === 'string') {
    // processChildren(vnode, container)
  }
  else if (isObject(vnode)) {
    processComponent(vnode, container)
  }
}

function processComponent(vnode: any, container: any) {
  mountComponent(vnode, container)
}

function mountComponent(vnode: any, container: any) {
  // 根据 vnode 创建组件实例
  const instance = createComponentInstance(vnode)

  // 初始化组件实例
  setupComponent(instance)
  // 进行 render
  setupRenderEffect(instance, container)
}

function setupRenderEffect(instance: any, container: any) {
  const subTree = instance.render()

  // vnode -> patch
  // vnode -> element -> patch

  patch(subTree, container)
}
