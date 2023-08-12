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
function isObject(val) {
    return val !== null && typeof val === 'object';
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

/* eslint-disable @typescript-eslint/no-this-alias */
const targetMaps = new Map();
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
function createActiveObject(raw, baseHandlers) {
    if (!isObject(raw)) {
        console.warn(`target ${raw} 不是对象类型`);
        return raw;
    }
    return new Proxy(raw, baseHandlers);
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

function createComponentInstance(vnode, parent) {
    console.log('333', parent);
    const component = {
        vnode,
        type: vnode.type,
        setupState: {},
        props: {},
        slots: {},
        provides: {},
        parent,
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
        instance.setupState = setupResult;
    // 保证组件的 render 一定有值
    finishComponentSetup(instance);
}
function finishComponentSetup(instance) {
    const component = instance.type;
    if (component.render)
        instance.render = component.render;
}
// currentInstance
let currentInstance = null;
function getCurrentInstance() {
    return currentInstance;
}
function setCurrentInstance(value) {
    currentInstance = value;
}

const Fragment = Symbol('Fragment');
const Text = Symbol('Text');
function createVNode(type, props, children) {
    const vnode = {
        type,
        props,
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

function render(vnode, container) {
    // render 里只做 patch
    patch(vnode, container, null);
}
// 根据 vnode 的类型进行 组件/元素 的处理
function patch(vnode, container, parentComponent) {
    const { shapeFlag, type } = vnode;
    switch (type) {
        case Fragment:
            processFragment(vnode, container, parentComponent);
            break;
        case Text:
            processText(vnode, container);
            break;
        default:
            if (shapeFlag & ShapeFlags.ELEMENT)
                processElement(vnode, container, parentComponent);
            else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT)
                processComponent(vnode, container, parentComponent);
            break;
    }
}
function processText(vnode, container) {
    const { children } = vnode;
    const textNode = (vnode.el = document.createTextNode(children));
    container.append(textNode);
}
// fragment 不需要进行其 vnode 处理, 只需要渲染/处理 children (替换掉了 container)
function processFragment(vnode, container, parentComponent) {
    mountChildren(vnode, container, parentComponent);
}
function processElement(vnode, container, parentComponent) {
    mountElement(vnode, container, parentComponent);
}
function mountElement(vnode, container, parentComponent) {
    // vnode -> element -> div
    const { type, props, children, shapeFlag } = vnode;
    const el = (vnode.el = document.createElement(type)); // 存储 $el
    // children: Array / String
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN)
        el.textContent = children;
    else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN)
        mountChildren(vnode, el, parentComponent);
    // props
    const isOn = (key) => /^on[A-Z]/.test(key);
    for (const key in props) {
        const val = props[key];
        if (isOn(key)) {
            // 绑定dom事件
            const event = key.slice(2).toLocaleLowerCase();
            el.addEventListener(event, val);
        }
        else {
            el.setAttribute(key, val);
        }
    }
    container.append(el);
}
function mountChildren(vnode, container, parentComponent) {
    vnode.children.forEach((v) => {
        patch(v, container, parentComponent);
    });
}
function processComponent(vnode, container, parentComponent) {
    mountComponent(vnode, container, parentComponent);
}
function mountComponent(initialVNode, container, parentComponent) {
    // 根据 vnode 创建组件实例
    const instance = createComponentInstance(initialVNode, parentComponent);
    // 初始化组件实例
    setupComponent(instance);
    // 进行 render
    setupRenderEffect(instance, initialVNode, container);
}
function setupRenderEffect(instance, initialVNode, container) {
    const { proxy } = instance;
    const subTree = instance.render.apply(proxy);
    // vnode -> patch
    patch(subTree, container, instance);
    // vnode -> element -> patch
    initialVNode.el = subTree.el; // 在所有的 subTree 初始化完成后，赋值 $el
}

function createApp(rootComponent) {
    return {
        mount(rootContainer) {
            // 转化成 vnode
            // 对 vnode 进行处理
            const vnode = createVNode(rootComponent);
            // 进行 render 操作
            render(vnode, transformRootContainer(rootContainer));
        },
    };
}
function transformRootContainer(rootContainer) {
    if (typeof rootContainer === 'string')
        return document.querySelector(rootContainer);
    return rootContainer;
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

function provide(key, value) {
    const currentInstance = getCurrentInstance();
    // 将 value 存储在 currentInstance 的 provides 里
    if (currentInstance) {
        const { provides } = currentInstance;
        provides[key] = value;
    }
}
function inject(key) {
    const currentInstance = getCurrentInstance();
    if (currentInstance) {
        // 从父组件实例获取 provides 存储
        const parentProvides = currentInstance.parent.provides;
        const value = parentProvides[key];
        return value;
    }
}

export { createApp, createTextVNode, getCurrentInstance, h, inject, provide, renderSlots };
