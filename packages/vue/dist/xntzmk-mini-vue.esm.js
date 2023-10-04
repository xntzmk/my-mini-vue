function toDisplayString(value) {
    return String(value);
}

// 提升性能
// 进行或运算: 修改 shapeFlag, 进行与运算: 判断 shapeFlag
var ShapeFlags;
(function (ShapeFlags) {
    ShapeFlags[ShapeFlags["ELEMENT"] = 1] = "ELEMENT";
    ShapeFlags[ShapeFlags["STATEFUL_COMPONENT"] = 2] = "STATEFUL_COMPONENT";
    ShapeFlags[ShapeFlags["TEXT_CHILDREN"] = 4] = "TEXT_CHILDREN";
    ShapeFlags[ShapeFlags["ARRAY_CHILDREN"] = 8] = "ARRAY_CHILDREN";
    ShapeFlags[ShapeFlags["SLOT_CHILDREN"] = 16] = "SLOT_CHILDREN";
})(ShapeFlags || (ShapeFlags = {}));

const extend = Object.assign;
const EMPTY_OBJ = {};
function isObject(val) {
    return val !== null && typeof val === 'object';
}
function isString(val) {
    return typeof val === 'string';
}
function hasChanged(val, newVal) {
    return !Object.is(val, newVal);
}
function hasOwn(target, key) {
    return Object.prototype.hasOwnProperty.call(target, key);
}
function camelize(str) {
    return str.replace(/-(\w)/, (_, c) => c ? c.toLocaleUpperCase() : '');
}
function capitalize(str) {
    return str.charAt(0).toLocaleUpperCase() + str.slice(1);
}
function toHandlerKey(str) {
    return str ? `on${capitalize(str)}` : '';
}

const TO_DISPLAY_STRING = Symbol('toDisplayString');
const CREATE_ELEMENT_VNODE = Symbol('createElementVNode');
const helperMapName = {
    [TO_DISPLAY_STRING]: 'toDisplayString',
    [CREATE_ELEMENT_VNODE]: 'createElementVNode',
};

function generate(ast) {
    const context = createCodegenContext();
    const { push } = context;
    genFunctionPreamble(ast, context);
    const functionName = 'render';
    const args = ['_ctx', '_cache'];
    const signature = args.join(', ');
    push(`function ${functionName}(${signature}) { `);
    push('return ');
    genNode(ast.codegenNode, context);
    push(' }');
    return context;
}
function genFunctionPreamble(ast, context) {
    const { push } = context;
    const VueBinging = 'Vue';
    const aliasHelper = (s) => `${helperMapName[s]}: _${helperMapName[s]}`;
    if (ast.helpers.length > 0)
        push(`const { ${ast.helpers.map(aliasHelper).join(', ')} } = ${VueBinging}`);
    push('\n');
    push('return ');
}
function genNode(node, context) {
    switch (node.type) {
        case 3 /* NodeTypes.TEXT */:
            genText(node, context);
            break;
        case 0 /* NodeTypes.INTERPOLATION */:
            genInterpolation(node, context);
            break;
        case 1 /* NodeTypes.SIMPLE_EXPRESSION */:
            genExpression(node, context);
            break;
        case 2 /* NodeTypes.ELEMENT */:
            genElement(node, context);
            break;
        case 5 /* NodeTypes.COMPOUND_EXPRESSION */:
            genCompoundExpression(node, context);
            break;
    }
}
function genCompoundExpression(node, context) {
    const { push } = context;
    const children = node.children;
    for (let i = 0; i < children.length; i++) {
        const child = children[i];
        if (isString(child))
            push(child);
        else
            genNode(child, context);
    }
}
function genElement(node, context) {
    const { push, helper } = context;
    const { tag, props, children } = node;
    push(`${helper(CREATE_ELEMENT_VNODE)}(`);
    genNodeList(genNullable([tag, props, children]), context);
    push(')');
}
function genNodeList(nodes, context) {
    const { push } = context;
    for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        if (isString(node))
            push(node);
        else
            genNode(node, context);
        if (i < node.length - 1)
            push(', ');
    }
}
function genNullable(args) {
    return args.map((arg) => arg || 'null');
}
function genInterpolation(node, context) {
    const { push } = context;
    push(`${context.helper(TO_DISPLAY_STRING)}(`);
    genNode(node.content, context);
    push(')');
}
function genExpression(node, context) {
    const { push } = context;
    push(`${node.content}`); // _ctx 在 transform 里添加
}
function genText(node, context) {
    const { push } = context;
    push(`'${node.content}'`);
}
function createCodegenContext() {
    const context = {
        code: '',
        push(source) {
            context.code += source;
        },
        helper(key) {
            return `_${helperMapName[key]}`;
        },
    };
    return context;
}

function baseParse(content) {
    const context = createParserContext(content); // 引入全局上下文
    return createRoot(parseChildren(context, []));
}
function parseChildren(context, ancestors) {
    const nodes = [];
    while (!isEnd(context, ancestors)) {
        const s = context.source;
        let node;
        // 解析插值
        if (s.startsWith('{{')) {
            node = parseInterpolation(context);
        }
        // 解析元素
        else if (s[0] === '<') {
            if (/[a-z]/i.test(s[1]))
                node = parseElement(context, ancestors);
        }
        if (!node)
            node = parseText(context);
        nodes.push(node);
    }
    return nodes;
}
function isEnd(context, ancestors) {
    const s = context.source;
    // 1. 在栈中查找对应tag
    if (s.startsWith('</')) {
        for (let i = ancestors.length - 1; i >= 0; i--) {
            const tag = ancestors[i].tag;
            if (startWithEndTagOpen(s, tag))
                return true;
        }
    }
    // 2. source 有值
    return !s;
}
function parseText(context) {
    const s = context.source;
    const endToken = ['<', '{{'];
    let endIndex = s.length;
    for (let i = 0; i < endToken.length; i++) {
        const index = s.indexOf(endToken[i]);
        if (index !== -1 && endIndex > index)
            endIndex = index;
    }
    const content = parseTextData(context, endIndex);
    return {
        type: 3 /* NodeTypes.TEXT */,
        content,
    };
}
// 将 截取&推进 封装到一起
function parseTextData(context, length) {
    const content = context.source.slice(0, length);
    advanceBy(context, length);
    return content;
}
function parseElement(context, ancestors) {
    const element = parseTag(context, 0 /* TagType.Start */);
    ancestors.push(element);
    element.children = parseChildren(context, ancestors);
    ancestors.pop();
    if (startWithEndTagOpen(context.source, element.tag))
        parseTag(context, 1 /* TagType.End */); // 推进尾部标签
    else
        throw new Error(`lack the end tag: ${element.tag}`);
    return element;
}
function startWithEndTagOpen(source, tag) {
    return source.startsWith('</') && source.slice(2, 2 + tag.length).toLowerCase() === tag.toLowerCase();
}
function parseTag(context, type) {
    // 1. 解析tag
    const match = (/^<\/?([a-z]+)/i).exec(context.source);
    const tag = match[1];
    // 2. 推进
    advanceBy(context, match[0].length); // 推进 tag+左尖括号(包括斜杠)
    advanceBy(context, 1); // 推进 tag+右尖括号
    // 结束标签直接返回
    if (type === 1 /* TagType.End */)
        return;
    return {
        type: 2 /* NodeTypes.ELEMENT */,
        tag,
    };
}
function parseInterpolation(context) {
    const openDelimiter = '{{';
    const closeDelimiter = '}}';
    // 根据分隔符截取，进行推进
    const closeIndex = context.source.indexOf(closeDelimiter, openDelimiter.length);
    advanceBy(context, openDelimiter.length);
    // 截取到字符后，根据字符长度再进行推进
    const rawContentLength = closeIndex - openDelimiter.length;
    const rawContent = parseTextData(context, rawContentLength); // 获取到要截取的字符
    const content = rawContent.trim();
    advanceBy(context, closeDelimiter.length);
    return {
        type: 0 /* NodeTypes.INTERPOLATION */,
        content: {
            type: 1 /* NodeTypes.SIMPLE_EXPRESSION */,
            content,
        },
    };
}
function advanceBy(context, length) {
    context.source = context.source.slice(length);
}
function createRoot(children) {
    return {
        children,
        type: 4 /* NodeTypes.ROOT */,
    };
}
function createParserContext(content) {
    return {
        source: content,
    };
}

function transform(root, options = {}) {
    const context = createTransformContext(root, options);
    // 深度优先遍历
    traverseNode(root, context);
    createRootCodegen(root);
    root.helpers = [...context.helpers.keys()];
}
function createTransformContext(root, options) {
    const context = {
        root,
        nodeTransforms: options.nodeTransforms || [],
        helpers: new Map(),
        helper(key) {
            context.helpers.set(key, 1);
        },
    };
    return context;
}
// 基于 codegenNode 通过 codegen 生成代码
function createRootCodegen(root) {
    const child = root.children[0];
    if (child.type === 2 /* NodeTypes.ELEMENT */)
        root.codegenNode = child.codegenNode;
    else
        root.codegenNode = root.children[0];
}
function traverseNode(node, context) {
    const { nodeTransforms } = context;
    const exitFns = [];
    for (let i = 0; i < nodeTransforms.length; i++) {
        const transform = nodeTransforms[i];
        const onExit = transform(node, context);
        if (onExit)
            exitFns.push(onExit);
    }
    switch (node.type) {
        case 0 /* NodeTypes.INTERPOLATION */:
            context.helper(TO_DISPLAY_STRING);
            break;
        case 4 /* NodeTypes.ROOT */:
        case 2 /* NodeTypes.ELEMENT */:
            traverseChildren(node, context);
            break;
    }
    // 倒序执行
    let i = exitFns.length;
    while (i--)
        exitFns[i]();
}
function traverseChildren(node, context) {
    const children = node.children;
    for (let i = 0; i < children.length; i++) {
        const node = children[i];
        traverseNode(node, context);
    }
}

function createVNodeCall(context, tag, props, children) {
    context.helper(CREATE_ELEMENT_VNODE);
    return {
        type: 2 /* NodeTypes.ELEMENT */,
        tag,
        props,
        children,
    };
}

function transformElement(node, context) {
    if (node.type === 2 /* NodeTypes.ELEMENT */) {
        return () => {
            // tag
            const vnodeTag = `'${node.tag}'`;
            // props
            let vnodeProps;
            // children
            const children = node.children;
            const vnodeChildren = children[0];
            node.codegenNode = createVNodeCall(context, vnodeTag, vnodeProps, vnodeChildren);
        };
    }
}

function transformExpression(node) {
    if (node.type === 0 /* NodeTypes.INTERPOLATION */)
        processExpression(node.content);
}
function processExpression(node) {
    node.content = `_ctx.${node.content}`;
}

function isText(node) {
    return node.type === 3 /* NodeTypes.TEXT */ || node.type === 0 /* NodeTypes.INTERPOLATION */;
}

function transformText(node) {
    if (node.type === 2 /* NodeTypes.ELEMENT */) {
        return () => {
            // 生成 compound 复合节点树
            const { children } = node;
            let currentContainer; // 收集相邻节点
            for (let i = 0; i < children.length; i++) {
                const child = children[i];
                if (isText(child)) {
                    // 查看下一个节点是否为Text
                    for (let j = i + 1; j < children.length; j++) {
                        const next = children[j];
                        if (isText(next)) {
                            if (!currentContainer) {
                                currentContainer = children[i] = {
                                    type: 5 /* NodeTypes.COMPOUND_EXPRESSION */,
                                    children: [child],
                                };
                            }
                            currentContainer.children.push(' + ');
                            currentContainer.children.push(next);
                            // 放入节点后删除该节点
                            children.splice(j, 1);
                            // 删除节点后 j 需要前移
                            j--;
                        }
                        else {
                            currentContainer = undefined;
                            break;
                        }
                    }
                }
            }
        };
    }
}

function baseCompile(template) {
    const ast = baseParse(template);
    transform(ast, {
        nodeTransforms: [transformExpression, transformElement, transformText],
    });
    return generate(ast);
}

const Fragment = Symbol('Fragment');
const Text = Symbol('Text');
function createVNode(type, props, children) {
    const vnode = {
        type,
        props,
        key: props && props.key,
        children,
        el: null,
        shapeFlag: getShapeFlag(type),
    };
    if (typeof children === 'string')
        vnode.shapeFlag |= ShapeFlags.TEXT_CHILDREN;
    else if (Array.isArray(children))
        vnode.shapeFlag |= ShapeFlags.ARRAY_CHILDREN;
    // slot: 组件 + object children
    if (vnode.shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
        if (typeof children === 'object')
            vnode.shapeFlag |= ShapeFlags.SLOT_CHILDREN;
    }
    return vnode;
}
function createTextVNode(text) {
    return createVNode(Text, {}, text);
}
function getShapeFlag(type) {
    return typeof type === 'string'
        ? ShapeFlags.ELEMENT
        : ShapeFlags.STATEFUL_COMPONENT;
}

function h(type, props, children) {
    return createVNode(type, props, children);
}

function renderSlots(slots, slotsName, props) {
    const slot = slots[slotsName];
    // 作用域插槽: 子组件传入props, 父组件的slot需要用函数调用
    if (slot) {
        if (typeof slot === 'function')
            return h(Fragment, {}, slot(props));
    }
}

let activeEffect;
let shouldTrack = false; // 控制 stop 操作后 trigger 里 run 的运行
class ReactiveEffect {
    constructor(fn, scheduler) {
        this.scheduler = scheduler;
        this.deps = [];
        this.active = true;
        this._fn = fn;
    }
    run() {
        if (!this.active)
            return this._fn();
        shouldTrack = true;
        activeEffect = this;
        const res = this._fn(); // 这里运行后会触发 get 操作
        shouldTrack = false;
        return res;
    }
    stop() {
        if (this.active) {
            this.active = false;
            this.onStop && this.onStop();
            cleanUpEffect(this);
        }
    }
}
function cleanUpEffect(effect) {
    effect.deps.forEach((dep) => {
        dep.delete(effect);
    });
}
function effect(fn, options = {}) {
    const _effect = new ReactiveEffect(fn);
    extend(_effect, options);
    _effect.run();
    const runner = _effect.run.bind(_effect);
    runner.effect = _effect;
    return runner;
}
const targetMaps = new Map();
function track(target, key) {
    // 提取不需要 track 的情况
    if (!isTracking())
        return;
    let depMaps = targetMaps.get(target);
    if (!depMaps) {
        depMaps = new Map();
        targetMaps.set(target, depMaps);
    }
    let dep = depMaps.get(key);
    if (!dep) {
        dep = new Set();
        depMaps.set(key, dep);
    }
    trackEffects(dep);
}
function trackEffects(dep) {
    if (dep.has(activeEffect))
        return;
    dep.add(activeEffect);
    activeEffect.deps.push(dep);
}
function isTracking() {
    return shouldTrack && activeEffect !== undefined;
}
function trigger(target, key) {
    const depMaps = targetMaps.get(target);
    const dep = depMaps.get(key);
    triggerEffects(dep);
}
function triggerEffects(dep) {
    for (const effect of dep) {
        if (effect.scheduler)
            effect.scheduler();
        else
            effect.run();
    }
}

const get = createGetter();
const set = createSetter();
const readonlyGet = createGetter(true);
const shallowReadonlyGet = createGetter(true, true);
var ReactiveFlags;
(function (ReactiveFlags) {
    ReactiveFlags["IS_REACTIVE"] = "__v_isReactive";
    ReactiveFlags["IS_READONLY"] = "__v_isReadonly";
})(ReactiveFlags || (ReactiveFlags = {}));
function createGetter(isReadonly = false, shallow = false) {
    return function (target, key) {
        const res = Reflect.get(target, key);
        if (key === ReactiveFlags.IS_REACTIVE)
            return !isReadonly;
        if (key === ReactiveFlags.IS_READONLY)
            return isReadonly;
        if (shallow)
            return res;
        // res 为对象，再次添加代理
        if (isObject(res))
            return isReadonly ? readonly(res) : reactive(res);
        // 依赖收集
        if (!isReadonly)
            track(target, key);
        return res;
    };
}
function createSetter() {
    return function (target, key, value) {
        const res = Reflect.set(target, key, value);
        // 触发依赖
        trigger(target, key);
        return res;
    };
}
const mutableHandlers = {
    get,
    set,
};
const readonlyHandlers = {
    get: readonlyGet,
    set(target, key, value) {
        console.warn(`key:${key} set 失败，因为 target 是 readonly 类型`);
        return true;
    },
};
const shallowReadonlyHandlers = extend({}, readonlyHandlers, {
    get: shallowReadonlyGet,
});

function reactive(raw) {
    return createActiveObject(raw, mutableHandlers);
}
function readonly(raw) {
    return createActiveObject(raw, readonlyHandlers);
}
function shallowReadonly(raw) {
    return createActiveObject(raw, shallowReadonlyHandlers);
}
function isReactive(raw) {
    return !!raw[ReactiveFlags.IS_REACTIVE];
}
function isReadonly(raw) {
    return !!raw[ReactiveFlags.IS_READONLY];
}
function isProxy(raw) {
    return isReactive(raw) || isReadonly(raw);
}
function createActiveObject(raw, baseHandlers) {
    if (!isObject(raw)) {
        console.warn(`target ${raw} 不是对象类型`);
        return raw;
    }
    return new Proxy(raw, baseHandlers);
}

class RefImpl {
    constructor(value) {
        this.__v_isRef = true;
        this._rawValue = value;
        this._value = convert(value);
        this.dep = new Set();
    }
    get value() {
        trackRefValue(this.dep);
        return this._value;
    }
    set value(newValue) {
        // 无改动时不触发 trigger 操作
        if (!hasChanged(this._rawValue, newValue))
            return;
        this._rawValue = newValue;
        this._value = convert(newValue);
        triggerEffects(this.dep); // 需要先修改value，再trigger
    }
}
function convert(value) {
    return isObject(value) ? reactive(value) : value;
}
function trackRefValue(dep) {
    if (!isTracking())
        return;
    trackEffects(dep);
}
function ref(raw) {
    return new RefImpl(raw);
}
function isRef(raw) {
    return !!raw.__v_isRef;
}
function unRef(raw) {
    return isRef(raw) ? raw.value : raw;
}
function proxyRefs(objectWithRefs) {
    return new Proxy(objectWithRefs, {
        get(target, key) {
            return unRef(Reflect.get(target, key)); // 直接对返回值进行 unRef 操作
        },
        set(target, key, value) {
            if (isRef(target[key]) && !isRef(value))
                return Reflect.set(target[key], 'value', value);
            else
                return Reflect.set(target, key, value);
        },
    });
}

function emit(instance, event, ...args) {
    const { props } = instance;
    // TPP: 实现一个特定的行为 -> 重构成通用的行为
    const handlerEvent = toHandlerKey(camelize(event));
    if (hasOwn(props, handlerEvent))
        props[handlerEvent](...args);
}

function initProps(instance, rawProps) {
    instance.props = rawProps || {};
}

const publicPropertiesMap = {
    $el: (i) => i.vnode.el,
    $slots: (i) => i.slots,
    $props: (i) => i.props,
};
const PublicInstanceProxyHandlers = {
    get({ _: instance }, key) {
        const { setupState, props } = instance;
        if (hasOwn(setupState, key))
            return setupState[key];
        else if (hasOwn(props, key))
            return props[key];
        const publicGetter = publicPropertiesMap[key];
        if (publicGetter)
            return publicGetter(instance);
    },
};

function initSlots(instance, children) {
    const { vnode } = instance;
    if (vnode.shapeFlag & ShapeFlags.SLOT_CHILDREN)
        normalizeObjectSlots(children, instance.slots);
}
function normalizeObjectSlots(children, slots) {
    for (const key in children) {
        const value = children[key];
        // slots[key] 需要赋值一个函数, 在 renderSlots 的时候调用, 传入子组件的props(作用域插槽)
        slots[key] = (props) => normalizeSlotValue(value(props));
    }
}
function normalizeSlotValue(value) {
    // 这里需要将 children 转为数组类型，因为 h 函数只接受 string 或者 array 的 children
    return Array.isArray(value) ? value : [value];
}

/* eslint-disable @typescript-eslint/no-use-before-define */
function createComponentInstance(vnode, parent) {
    const component = {
        vnode,
        type: vnode.type,
        setupState: {},
        props: {},
        slots: {},
        component: null,
        next: null,
        provides: parent ? parent.provides : {},
        parent,
        subTree: {},
        isMounted: false,
        emit: () => ({}),
    };
    component.emit = emit.bind(null, component);
    return component;
}
function setupComponent(instance) {
    const { props, children } = instance.vnode;
    // initProps
    initProps(instance, props);
    // initSlots
    initSlots(instance, children);
    setupStatefulComponent(instance);
}
function setupStatefulComponent(instance) {
    const component = instance.type;
    // ctx
    instance.proxy = new Proxy({ _: instance }, PublicInstanceProxyHandlers);
    const { setup } = component;
    // 用户可能不写 setup
    if (setup) {
        setCurrentInstance(instance);
        const setupResult = setup(shallowReadonly(instance.props), { emit: instance.emit });
        setCurrentInstance(null);
        handleSetupResult(instance, setupResult);
    }
}
function handleSetupResult(instance, setupResult) {
    // function object
    if (isObject(setupResult))
        instance.setupState = proxyRefs(setupResult); // render 解析 ref.value
    // 保证组件的 render 一定有值
    finishComponentSetup(instance);
}
// render 函数赋值
function finishComponentSetup(instance) {
    const Component = instance.type;
    if (compiler && !Component.render) {
        if (Component.template)
            Component.render = compiler(Component.template);
    }
    instance.render = Component.render;
}
// currentInstance
let currentInstance = null;
function getCurrentInstance() {
    return currentInstance;
}
function setCurrentInstance(value) {
    currentInstance = value;
}
// compiler
let compiler;
function registerRuntimeCompiler(_compiler) {
    compiler = _compiler;
}

function provide(key, value) {
    const currentInstance = getCurrentInstance();
    // 将 value 存储在 currentInstance 的 provides 里
    if (currentInstance) {
        // 解构赋值
        // 如果直接使用 provides = Object.create(parentProvides)
        // 会将 let 声明的 provides 引用一个新的地址,而不会修改原始对象(currentInstance)的 provides
        let { provides } = currentInstance;
        const parentProvides = currentInstance.parent.provides;
        // 原型只需要初始化一次
        if (provides === parentProvides)
            provides = (currentInstance.provides = Object.create(parentProvides));
        provides[key] = value;
    }
}
function inject(key, defaultValue) {
    const currentInstance = getCurrentInstance();
    if (currentInstance) {
        // 从父组件实例获取 provides 存储
        const parentProvides = currentInstance.parent.provides;
        if (key in parentProvides) {
            return parentProvides[key];
        }
        else if (defaultValue) {
            if (typeof defaultValue === 'function')
                return defaultValue();
            else
                return defaultValue;
        }
    }
}

function shouldUpdateComponent(prevVNode, nextVNode) {
    const { props: prevProps } = prevVNode;
    const { props: nextProps } = nextVNode;
    for (const key in prevProps) {
        if (nextProps[key] !== prevProps[key])
            return true;
    }
    return false;
}

function createAppAPI(render) {
    return function createApp(rootComponent) {
        return {
            mount(rootContainer) {
                // 转化成 vnode
                // 对 vnode 进行处理
                const vnode = createVNode(rootComponent);
                // 进行 render 操作
                render(vnode, transformRootContainer(rootContainer));
            },
        };
    };
}
function transformRootContainer(rootContainer) {
    if (typeof rootContainer === 'string')
        return document.querySelector(rootContainer);
    return rootContainer;
}

/* eslint-disable no-cond-assign */
const queue = [];
let isFlushPending = false; // 锁定微任务队列
const p = Promise.resolve();
function nextTick(fn) {
    return fn ? p.then(fn) : p;
}
function queueJobs(job) {
    if (!queue.includes(job))
        queue.push(job);
    queueFlush();
}
function queueFlush() {
    if (isFlushPending)
        return;
    isFlushPending = true;
    nextTick(flushJobs);
}
function flushJobs() {
    isFlushPending = false;
    let job;
    while (job = queue.shift())
        job && job();
}

/* eslint-disable unicorn/no-new-array */
function createRenderer(options) {
    const { createElement: hostCreateElement, patchProp: hostPatchProp, insert: hostInsert, remove: hostRemove, setElementText: hostSetElementText, } = options;
    function render(vnode, container) {
        // render 里只做 patch
        patch(null, vnode, container, null, null);
    }
    // 根据 vnode 的类型进行 组件/元素 的处理
    function patch(n1, n2, container, parentComponent, anchor) {
        const { shapeFlag, type } = n2;
        switch (type) {
            case Fragment:
                processFragment(n1, n2, container, parentComponent, anchor);
                break;
            case Text:
                processText(n1, n2, container);
                break;
            default:
                if (shapeFlag & ShapeFlags.ELEMENT)
                    processElement(n1, n2, container, parentComponent, anchor);
                else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT)
                    processComponent(n1, n2, container, parentComponent, anchor);
                break;
        }
    }
    function processText(n1, n2, container) {
        const { children } = n2;
        const textNode = (n2.el = document.createTextNode(children));
        container.append(textNode);
    }
    // fragment 不需要进行其 vnode 处理, 只需要渲染/处理 children (替换掉了 container)
    function processFragment(n1, n2, container, parentComponent, anchor) {
        mountChildren(n2.children, container, parentComponent, anchor);
    }
    function processElement(n1, n2, container, parentComponent, anchor) {
        if (!n1)
            mountElement(n2, container, parentComponent, anchor);
        else
            patchElement(n1, n2, container, parentComponent, anchor);
    }
    function patchElement(n1, n2, container, parentComponent, anchor) {
        console.log('patchElement');
        console.log('旧vnode n1:', n1);
        console.log('新vnode n2:', n2);
        const oldProps = n1.props || EMPTY_OBJ;
        const newProps = n2.props || EMPTY_OBJ;
        const el = (n2.el = n1.el);
        patchChildren(n1, n2, el, parentComponent, anchor); // 这里的 container 是 el(当前 patch 的 vnode) ----- 而不是 container
        patchProps(el, oldProps, newProps);
    }
    function patchChildren(n1, n2, container, parentComponent, anchor) {
        const prevShapeFlag = n1.shapeFlag;
        const c1 = n1.children;
        const { shapeFlag } = n2;
        const c2 = n2.children;
        if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
            if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN)
                unmountChildren(c1);
            if (c1 !== c2)
                hostSetElementText(container, c2);
        }
        else {
            if (prevShapeFlag & ShapeFlags.TEXT_CHILDREN) {
                hostSetElementText(container, '');
                mountChildren(c2, container, parentComponent, anchor);
            }
            else {
                // diff array
                patchKeyedChildren(c1, c2, container, parentComponent, anchor);
            }
        }
    }
    function patchKeyedChildren(c1, c2, container, parentComponent, parentAnchor) {
        let i = 0;
        let e1 = c1.length - 1;
        const l2 = c2.length;
        let e2 = l2 - 1;
        function isSameVNodeType(n1, n2) {
            return n1.type === n2.type && n1.key === n2.key;
        }
        // 1. 左侧对比
        while (i <= e1 && i <= e2) {
            const n1 = c1[i];
            const n2 = c2[i];
            if (isSameVNodeType(n1, n2))
                // 递归判断节点的子节点
                patch(n1, n2, container, parentComponent, parentAnchor);
            else
                break;
            i++;
        }
        // 2. 右侧对比 (while 条件和左侧的一样)
        while (i <= e1 && i <= e2) {
            const n1 = c1[e1];
            const n2 = c2[e2];
            if (isSameVNodeType(n1, n2))
                patch(n1, n2, container, parentComponent, parentAnchor);
            else
                break;
            e1--;
            e2--;
        }
        /** 新的比老的长 */
        if (i > e1) {
            if (i <= e2) {
                const nextPos = e2 + 1;
                const anchor = nextPos < l2 ? c2[nextPos].el : null; // 判断是左侧添加还是右侧添加
                console.log(anchor);
                while (i <= e2) {
                    patch(null, c2[i], container, parentComponent, anchor);
                    i++;
                }
            }
        }
        /** 新的比老的短 */
        else if (i > e2) {
            while (i <= e1) {
                hostRemove(c1[i].el);
                i++;
            }
        }
        /** 中间对比 */
        // 优化一：删除时如果patched数量已到达应有数量，则全部删除
        // 优化二：创建定长新映射数组
        // 优化三：给定key
        else {
            const s1 = i;
            const s2 = i;
            // 针对删除逻辑的优化 (新比老的少且多余部分可以直接删除的情况)
            const toBePatched = e2 - i + 1; // 记录应该 patch 的数量
            let patched = 0; // 记录已经 patch 的数量
            // 建立新树中间部分的映射，基于 key 进行对比索引位置
            const keyToNewIndexMap = new Map();
            for (let i = s2; i <= e2; i++) {
                const nextChild = c2[i];
                keyToNewIndexMap.set(nextChild.key, i);
            }
            let moved = false;
            let maxNewIndexSoFar = 0;
            // 初始化 从新的index映射为老的index
            // 创建数组的时候给定数组的长度，这个是性能最快的写法
            const newIndexToOldIndexMap = new Array(toBePatched);
            for (let i = 0; i < toBePatched; i++)
                newIndexToOldIndexMap[i] = 0;
            for (let i = s1; i <= e1; i++) {
                const prevChild = c1[i];
                if (patched >= toBePatched) {
                    hostRemove(prevChild.el);
                    continue;
                }
                // 有 key (key!==null & key!==undefined) -> 查找 map
                let newIndex;
                if (prevChild.key != null) {
                    newIndex = keyToNewIndexMap.get(prevChild.key);
                }
                // 无 key -> 遍历中间乱序部分
                else {
                    for (let j = s2; j <= e2; j++) {
                        const nextChild = c2[j];
                        if (isSameVNodeType(prevChild, nextChild)) {
                            newIndex = j;
                            break;
                        }
                    }
                }
                // 不存在的节点 -> 删除
                if (newIndex === undefined) {
                    hostRemove(prevChild.el);
                }
                // 存在的节点  -> 移动/不变
                else {
                    newIndexToOldIndexMap[newIndex - s2] = i + 1; // +1 防止出现i为0的情况 -> 0 被视为老节点不存在
                    // 如果 newIndex 一直为升序，则说明节点没有移动
                    if (newIndex >= maxNewIndexSoFar)
                        maxNewIndexSoFar = newIndex;
                    else
                        moved = true;
                    patch(prevChild, c2[newIndex], container, parentComponent, null);
                    patched++;
                }
            }
            // console.log('原序列', newIndexToOldIndexMap) // [5, 3, 4]
            const increasingNewIndexSequence = moved ? getSequence(newIndexToOldIndexMap) : [];
            // console.log('递增子序列', increasingNewIndexSequence) // [1, 2] (索引位置)
            // 在最长递增子序列里查找原序列对应索引是否有变动 (倒序查找，锁定 anchor)
            let j = increasingNewIndexSequence.length - 1;
            for (let i = toBePatched - 1; i >= 0; i--) {
                const nextIndex = i + s2;
                const nextChild = c2[nextIndex];
                const anchor = nextIndex + 1 < l2 ? c2[nextIndex + 1].el : null;
                // 需要重新创建的节点
                if (newIndexToOldIndexMap[i] === 0) {
                    patch(null, nextChild, container, parentComponent, anchor);
                }
                // 需要移动的节点
                else if (moved) {
                    // j < 0 => 最长递增子序列已经查找完，剩下节点全部需要移动
                    if (j < 0 || i !== increasingNewIndexSequence[j]) {
                        // console.log('移动位置')
                        hostInsert(nextChild.el, container, anchor);
                    }
                    else {
                        j--;
                    }
                }
            }
        }
    }
    function unmountChildren(children) {
        for (let i = 0; i < children.length; i++) {
            const el = children[i].el;
            // remove 操作
            hostRemove(el);
        }
    }
    function patchProps(el, oldProps, newProps) {
        if (oldProps !== newProps) {
            // prop 值改变/变成undefined/变成null
            for (const key in newProps) {
                const prevProp = oldProps[key];
                const nextProp = newProps[key];
                if (prevProp !== nextProp)
                    hostPatchProp(el, key, prevProp, nextProp);
            }
            if (oldProps !== EMPTY_OBJ) {
                // key 值在新props里没有
                for (const key in oldProps) {
                    if (!(key in newProps))
                        hostPatchProp(el, key, oldProps[key], null);
                }
            }
        }
    }
    function mountElement(vnode, container, parentComponent, anchor) {
        // vnode -> element -> div
        const { type, props, children, shapeFlag } = vnode;
        // 创建元素
        const el = (vnode.el = hostCreateElement(type)); // 存储 $el
        // children: Array / String
        if (shapeFlag & ShapeFlags.TEXT_CHILDREN)
            el.textContent = children;
        else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN)
            mountChildren(vnode.children, el, parentComponent, anchor);
        // 设置元素 Prop
        for (const key in props) {
            const val = props[key];
            hostPatchProp(el, key, null, val);
        }
        // 插入元素
        hostInsert(el, container, anchor);
    }
    function mountChildren(children, container, parentComponent, anchor) {
        children.forEach((v) => {
            patch(null, v, container, parentComponent, anchor);
        });
    }
    function processComponent(n1, n2, container, parentComponent, anchor) {
        if (!n1)
            mountComponent(n2, container, parentComponent, anchor);
        else
            updateComponent(n1, n2);
    }
    function updateComponent(n1, n2) {
        const instance = n2.component = n1.component;
        if (shouldUpdateComponent(n1, n2)) {
            instance.next = n2; // 保存下一次更新的虚拟节点
            instance.update();
        }
        else {
            // 不需要更新
            n2.el = n1.el;
            instance.vnode = n2;
        }
    }
    function mountComponent(initialVNode, container, parentComponent, anchor) {
        // 根据 vnode 创建组件实例
        const instance = (initialVNode.component = createComponentInstance(initialVNode, parentComponent));
        // 初始化组件实例
        setupComponent(instance);
        // 进行 render
        setupRenderEffect(instance, initialVNode, container, anchor);
    }
    function setupRenderEffect(instance, initialVNode, container, anchor) {
        instance.update = effect(() => {
            if (!instance.isMounted) {
                /** 初始化 */
                const { proxy } = instance;
                // 实例的 render 函数会触发响应式对象的 getter
                const subTree = (instance.subTree = instance.render.apply(proxy, [proxy])); // 存储节点树
                patch(null, subTree, container, instance, anchor);
                initialVNode.el = subTree.el; // 在所有的 subTree 初始化完成后，赋值 $el
                instance.isMounted = true;
            }
            else {
                /** 更新 */
                const { next, vnode } = instance;
                if (next) {
                    next.el = vnode.el;
                    updateComponentPreRender(instance, next);
                }
                const { proxy } = instance;
                const subTree = instance.render.apply(proxy, [proxy]);
                const prevSubTree = instance.subTree;
                instance.subTree = subTree; // 更新 subTree
                patch(prevSubTree, subTree, container, instance, anchor);
            }
        }, {
            scheduler() {
                queueJobs(instance.update);
            },
        });
    }
    // 更新 vnode 和 组件属性/插槽等
    function updateComponentPreRender(instance, nextVNode) {
        instance.vnode = nextVNode;
        instance.next = null;
        instance.props = nextVNode.props;
    }
    return {
        createApp: createAppAPI(render),
    };
}
function getSequence(arr) {
    const p = arr.slice();
    const result = [0];
    let i, j, u, v, c;
    const len = arr.length;
    for (i = 0; i < len; i++) {
        const arrI = arr[i];
        if (arrI !== 0) {
            j = result[result.length - 1];
            if (arr[j] < arrI) {
                p[i] = j;
                result.push(i);
                continue;
            }
            u = 0;
            v = result.length - 1;
            while (u < v) {
                c = (u + v) >> 1;
                if (arr[result[c]] < arrI)
                    u = c + 1;
                else
                    v = c;
            }
            if (arrI < arr[result[u]]) {
                if (u > 0)
                    p[i] = result[u - 1];
                result[u] = i;
            }
        }
    }
    u = result.length;
    v = result[u - 1];
    while (u-- > 0) {
        result[u] = v;
        v = p[v];
    }
    return result;
}

function createElement(type) {
    return document.createElement(type);
}
function patchProp(el, key, prevValue, nextValue) {
    const isOn = (key) => /^on[A-Z]/.test(key);
    if (isOn(key)) {
        // 绑定dom事件
        const event = key.slice(2).toLocaleLowerCase();
        el.addEventListener(event, nextValue);
    }
    else {
        if (nextValue === undefined || nextValue === null)
            el.removeAttribute(key);
        else
            el.setAttribute(key, nextValue);
    }
}
function insert(child, parent, anchor) {
    parent.insertBefore(child, anchor || null);
}
function remove(child) {
    const parent = child.parentNode;
    if (parent)
        parent.removeChild(child);
}
function setElementText(container, text) {
    container.textContent = text;
}
const renderer = createRenderer({
    createElement,
    patchProp,
    insert,
    remove,
    setElementText,
});
function createApp(...args) {
    return renderer.createApp(...args);
}

var runtimeDom = /*#__PURE__*/Object.freeze({
    __proto__: null,
    createApp: createApp,
    createElementVNode: createVNode,
    createRenderer: createRenderer,
    createTextVNode: createTextVNode,
    effect: effect,
    getCurrentInstance: getCurrentInstance,
    h: h,
    inject: inject,
    isProxy: isProxy,
    isReactive: isReactive,
    isReadonly: isReadonly,
    isRef: isRef,
    nextTick: nextTick,
    provide: provide,
    proxyRefs: proxyRefs,
    reactive: reactive,
    readonly: readonly,
    ref: ref,
    registerRuntimeCompiler: registerRuntimeCompiler,
    renderSlots: renderSlots,
    shallowReadonly: shallowReadonly,
    toDisplayString: toDisplayString,
    unRef: unRef
});

/* eslint-disable no-new-func */
// mini-vue 导出
// new Function(...args, functionBody) 前面都是参数列表，最后的参数是函数体
function compilerToFunction(template) {
    const { code } = baseCompile(template);
    const render = new Function('Vue', code)(runtimeDom);
    return render;
}
registerRuntimeCompiler(compilerToFunction);

export { createApp, createVNode as createElementVNode, createRenderer, createTextVNode, effect, getCurrentInstance, h, inject, isProxy, isReactive, isReadonly, isRef, nextTick, provide, proxyRefs, reactive, readonly, ref, registerRuntimeCompiler, renderSlots, shallowReadonly, toDisplayString, unRef };
