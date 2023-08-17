import { createRenderer } from '../runtime-core'

function createElement(type: any) {
  return document.createElement(type)
}

function patchProp(el: any, key: any, prevValue: any, nextValue: any) {
  const isOn = (key: string) => /^on[A-Z]/.test(key)
  if (isOn(key)) {
    // 绑定dom事件
    const event = key.slice(2).toLocaleLowerCase()
    el.addEventListener(event, nextValue)
  }
  else {
    if (nextValue === undefined || nextValue === null)
      el.removeAttribute(key)
    else
      el.setAttribute(key, nextValue)
  }
}

function insert(child: any, parent: any, anchor: any) {
  parent.insertBefore(child, anchor || null)
}

function remove(child: any) {
  const parent = child.parentNode
  if (parent)
    parent.removeChild(child)
}

function setElementText(container: any, text: string) {
  container.textContent = text
}

const renderer = createRenderer({
  createElement,
  patchProp,
  insert,
  remove,
  setElementText,
})

export function createApp(...args: any[]) {
  return renderer.createApp(...args)
}

export * from '../runtime-core' // runtime-dom 是 runtime-core 的上层
