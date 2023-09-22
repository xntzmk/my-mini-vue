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

const extend = Object.assign;
const EMPTY_OBJ = {};
function isObject(val) {
    return val !== null && typeof val === 'object';
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
                const subTree = (instance.subTree = instance.render.apply(proxy)); // 存储节点树
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
                const subTree = instance.render.apply(proxy);
                const prevSubTree = instance.subTree;
                instance.subTree = subTree; // 更新 subTree
                patch(prevSubTree, subTree, container, instance, anchor);
            }
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

export { createApp, createRenderer, createTextVNode, getCurrentInstance, h, inject, provide, ref, renderSlots };
