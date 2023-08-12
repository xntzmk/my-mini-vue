import { ShapeFlags } from '../shared/shapeFlags'
import { createComponentInstance, setupComponent } from './component'
import { Fragment, Text } from './vnode'

export function render(vnode: any, container: any) {
  // render 里只做 patch
  patch(vnode, container, null)
}

// 根据 vnode 的类型进行 组件/元素 的处理
function patch(vnode: any, container: any, parentComponent: any) {
  const { shapeFlag, type } = vnode
  switch (type) {
    case Fragment:
      processFragment(vnode, container, parentComponent)
      break
    case Text:
      processText(vnode, container)
      break

    default:
      if (shapeFlag & ShapeFlags.ELEMENT)
        processElement(vnode, container, parentComponent)
      else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT)
        processComponent(vnode, container, parentComponent)
      break
  }
}

function processText(vnode: any, container: any) {
  const { children } = vnode
  const textNode = (vnode.el = document.createTextNode(children))
  container.append(textNode)
}

// fragment 不需要进行其 vnode 处理, 只需要渲染/处理 children (替换掉了 container)
function processFragment(vnode: any, container: any, parentComponent: any) {
  mountChildren(vnode, container, parentComponent)
}

function processElement(vnode: any, container: any, parentComponent: any) {
  mountElement(vnode, container, parentComponent)
}

function mountElement(vnode: any, container: any, parentComponent: any) {
  // vnode -> element -> div
  const { type, props, children, shapeFlag } = vnode
  const el: HTMLElement = (vnode.el = document.createElement(type)) // 存储 $el

  // children: Array / String
  if (shapeFlag & ShapeFlags.TEXT_CHILDREN)
    el.textContent = children
  else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN)
    mountChildren(vnode, el, parentComponent)

  // props
  const isOn = (key: string) => /^on[A-Z]/.test(key)
  for (const key in props) {
    const val = props[key]
    if (isOn(key)) {
      // 绑定dom事件
      const event = key.slice(2).toLocaleLowerCase()
      el.addEventListener(event, val)
    }
    else { el.setAttribute(key, val) }
  }

  container.append(el)
}

function mountChildren(vnode: any, container: any, parentComponent: any) {
  vnode.children.forEach((v: any) => {
    patch(v, container, parentComponent)
  })
}

function processComponent(vnode: any, container: any, parentComponent: any) {
  mountComponent(vnode, container, parentComponent)
}

function mountComponent(initialVNode: any, container: any, parentComponent: any) {
  // 根据 vnode 创建组件实例
  const instance = createComponentInstance(initialVNode, parentComponent)

  // 初始化组件实例
  setupComponent(instance)
  // 进行 render
  setupRenderEffect(instance, initialVNode, container)
}

function setupRenderEffect(instance: any, initialVNode: any, container: any) {
  const { proxy } = instance
  const subTree = instance.render.apply(proxy)

  // vnode -> patch
  patch(subTree, container, instance)
  // vnode -> element -> patch
  initialVNode.el = subTree.el // 在所有的 subTree 初始化完成后，赋值 $el
}
