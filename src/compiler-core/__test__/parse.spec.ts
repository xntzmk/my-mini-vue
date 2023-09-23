import { NodeTypes } from '../src/ast'
import { baseParse } from '../src/parse'

describe('Parse', () => {
  describe('interpolation', () => {
    it('simple interpolation', () => {
      const ast = baseParse('{{ message }}')

      // root
      expect(ast.children[0]).toStrictEqual({
        type: NodeTypes.INTERPOLATION,
        content: {
          type: NodeTypes.SIMPLE_EXPRESSION,
          content: 'message',
        },
      })
    })
  })

  describe('element', () => {
    it('simple element div', () => {
      const ast = baseParse('<div></div>')

      expect(ast.children[0]).toStrictEqual({
        type: NodeTypes.ELEMENT,
        tag: 'div',
        children: [],
      })
    })
  })

  describe('text', () => {
    it('simple text', () => {
      const ast = baseParse('some text')

      expect(ast.children[0]).toStrictEqual({
        type: NodeTypes.TEXT,
        content: 'some text',
      })
    })
  })

  /** 联合测试 */
  // 1. happy path
  it('happy path', () => {
    const ast = baseParse('<div>hi,{{message}}</div>')

    expect(ast.children[0]).toStrictEqual({
      type: NodeTypes.ELEMENT,
      tag: 'div',
      children: [
        {
          type: NodeTypes.TEXT,
          content: 'hi,',
        },
        {
          type: NodeTypes.INTERPOLATION,
          content: {
            type: NodeTypes.SIMPLE_EXPRESSION,
            content: 'message',
          },
        },
      ],
    })
  })

  // 2. 元素嵌套
  it('Nested element', () => {
    const ast = baseParse('<div><p>hi</p>{{message}}</div>')

    expect(ast.children[0]).toStrictEqual({
      type: NodeTypes.ELEMENT,
      tag: 'div',
      children: [
        {
          type: NodeTypes.ELEMENT,
          tag: 'p',
          children: [
            {
              type: NodeTypes.TEXT,
              content: 'hi',
            },
          ],
        },
        {
          type: NodeTypes.INTERPOLATION,
          content: {
            type: NodeTypes.SIMPLE_EXPRESSION,
            content: 'message',
          },
        },
      ],
    })
  })

  // 3. 缺少标签时报错
  it('Should throw error when lack the end tag', () => {
    expect(() => {
      baseParse('<div><span></div>')
    }).toThrow('lack the end tag: span')
  })
})
