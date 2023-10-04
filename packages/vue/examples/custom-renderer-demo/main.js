import { createRenderer } from '../../dist/xntzmk-mini-vue.esm.js'
import { App } from './App.js'

console.log(PIXI)

const game = new PIXI.Application({
  width: 500,
  height: 500,
})
document.body.append(game.view)

const renderer = createRenderer({
  createElement(type) {
    if (type === 'rect') {
      const rect = new PIXI.Graphics()
      rect.beginFill(0xFF0000)
      rect.drawRect(0, 0, 100, 100)
      rect.endFill()
      return rect
    }
  },

  patchProp(el, key, val) {
    el[key] = val
  },

  insert(child, parent) {
    parent.addChild(child)
  },
})

renderer.createApp(App).mount(game.stage)