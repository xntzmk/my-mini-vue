import { NodeTypes } from './ast'

export function baseParse(content: string) {
  const context = createParserContext(content) // 引入全局上下文

  return createRoot(parseChildren(context))
}

function parseChildren(context: any) {
  const nodes = []

  let node

  // 解析插值
  if (context.source.startsWith('{{'))
    node = parseInterpolation(context)

  nodes.push(node)

  return nodes
}

function parseInterpolation(context: any) {
  const openDelimiter = '{{'
  const closeDelimiter = '}}'

  // 根据分隔符截取，进行推进
  const closeIndex = context.source.indexOf(closeDelimiter, openDelimiter.length)
  advanceBy(context, openDelimiter.length)

  // 截取到字符后，根据字符长度再进行推进
  const rawContentLength = closeIndex - openDelimiter.length
  const rawContent = context.source.slice(0, rawContentLength) // 获取到要截取的字符
  const content = rawContent.trim()
  advanceBy(context, rawContentLength + closeDelimiter.length)

  return {
    type: NodeTypes.INTERPOLATION,
    content: {
      type: NodeTypes.SIMPLE_EXPRESSION,
      content,
    },
  }
}

function advanceBy(context: any, length: number) {
  context.source = context.source.slice(length)
}

function createRoot(children: any[]) {
  return {
    children,
  }
}

function createParserContext(content: string): any {
  return {
    source: content,
  }
}
