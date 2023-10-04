export { h } from './h'
export { renderSlots } from './helpers/renderSlots'
export { createTextVNode, createVNode as createElementVNode } from './vnode'
export { getCurrentInstance, registerRuntimeCompiler } from './component'
export { provide, inject } from './apiInject'
export { createRenderer } from './renderer'
export { nextTick } from './scheduler'
export { toDisplayString } from '@xntzmk-mini-vue/shared'
export * from '@xntzmk-mini-vue/reactivity' // runtime-core导出reactivity ，根据 vue 官方的依赖图
