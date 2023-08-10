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
  // vnode -> element -> div
  const { type, props, children } = vnode
  const el: HTMLElement = (vnode.el = document.createElement(type)) // 存储 $el

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

function mountComponent(initialVNode: any, container: any) {
  // 根据 vnode 创建组件实例
  const instance = createComponentInstance(initialVNode)

  // 初始化组件实例
  setupComponent(instance)
  // 进行 render
  setupRenderEffect(instance, initialVNode, container)
}

function setupRenderEffect(instance: any, initialVNode: any, container: any) {
  const { proxy } = instance
  const subTree = instance.render.apply(proxy)

  // vnode -> patch
  patch(subTree, container)
  // vnode -> element -> patch
  initialVNode.el = subTree.el // 在所有的 subTree 初始化完成后，赋值 $el
}
