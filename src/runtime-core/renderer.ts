import { isObject } from '../shared/index'
import { createComponentInstance, setupComponent } from './component'

export function render(vnode: any, container: any) {
  // render 里只做 patch
  patch(vnode, container)
}

// 根据 vnode 的类型进行 组件/元素 的处理
function patch(vnode: any, container: any) {
  if (typeof vnode.type === 'string')
    processElement(vnode, container)
  else if (isObject(vnode))
    processComponent(vnode, container)
}

function processElement(vnode: any, container: any) {
  mountElement(vnode, container)
}

function mountElement(vnode: any, container: any) {
  const { type, props, children } = vnode
  const el: HTMLElement = document.createElement(type)

  // children: Array / String
  if (typeof children === 'string')
    el.textContent = children
  else if (Array.isArray(children))
    mountChildren(vnode, el)

  // props
  for (const key in props)
    el.setAttribute(key, props[key])

  container.append(el)
}

function mountChildren(vnode: any, container: any) {
  vnode.children.forEach((v: any) => {
    patch(v, container)
  })
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
