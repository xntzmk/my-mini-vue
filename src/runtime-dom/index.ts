import { createRenderer } from '../runtime-core'

function createElement(type: any) {
  return document.createElement(type)
}

function patchProp(el: any, key: any, value: any) {
  const isOn = (key: string) => /^on[A-Z]/.test(key)
  if (isOn(key)) {
    // 绑定dom事件
    const event = key.slice(2).toLocaleLowerCase()
    el.addEventListener(event, value)
  }
  else {
    el.setAttribute(key, value)
  }
}

function insert(child: any, parent: any) {
  parent.append(child)
}

const renderer = createRenderer({
  createElement,
  patchProp,
  insert,
})

export function createApp(...args: any[]) {
  return renderer.createApp(...args)
}

export * from '../runtime-core' // runtime-dom 是 runtime-core 的上层
