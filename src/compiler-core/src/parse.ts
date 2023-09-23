import { NodeTypes } from './ast'

const enum TagType {
  Start,
  End,
}

export function baseParse(content: string) {
  const context = createParserContext(content) // 引入全局上下文

  return createRoot(parseChildren(context))
}

function parseChildren(context: any) {
  const nodes = []

  const s = context.source
  let node

  // 解析插值
  if (s.startsWith('{{')) {
    node = parseInterpolation(context)
  }
  // 解析元素
  else if (s[0] === '<') {
    if (/[a-z]/i.test(s[1]))
      node = parseElement(context)
  }

  if (!node)
    node = parseText(context)

  nodes.push(node)

  return nodes
}

function parseText(context: any) {
  const content = parseTextData(context, context.source.length)
  return {
    type: NodeTypes.TEXT,
    content,
  }
}

// 将 截取&推进 封装到一起
function parseTextData(context: any, length: number): any {
  const content = context.source.slice(0, length)
  advanceBy(context, length)
  return content
}

function parseElement(context: any) {
  const element = parseTag(context, TagType.Start)

  parseTag(context, TagType.End)

  return element
}

function parseTag(context: any, type: TagType) {
  // 1. 解析tag
  const match: any = (/^<\/?([a-z]+)/i).exec(context.source)
  const tag = match[1]

  // 2. 推进
  advanceBy(context, match[0].length) // 推进 tag+左尖括号(包括斜杠)
  advanceBy(context, 1) // 推进 tag+右尖括号

  // 结束标签直接返回
  if (type === TagType.End)
    return

  return {
    type: NodeTypes.ELEMENT,
    tag,
  }
}

function parseInterpolation(context: any) {
  const openDelimiter = '{{'
  const closeDelimiter = '}}'

  // 根据分隔符截取，进行推进
  const closeIndex = context.source.indexOf(closeDelimiter, openDelimiter.length)
  advanceBy(context, openDelimiter.length)

  // 截取到字符后，根据字符长度再进行推进
  const rawContentLength = closeIndex - openDelimiter.length
  const rawContent = parseTextData(context, rawContentLength) // 获取到要截取的字符
  const content = rawContent.trim()
  advanceBy(context, closeDelimiter.length)

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
