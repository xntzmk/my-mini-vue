function isObject(val) {
    return val !== null && typeof val === 'object';
}

function createComponentInstance(vnode) {
    const component = {
        vnode,
        type: vnode.type,
        setupState: {},
    };
    return component;
}
function setupComponent(instance) {
    // initProps
    // initSlots
    setupStatefulComponent(instance);
}
function setupStatefulComponent(instance) {
    const component = instance.type;
    // ctx
    instance.proxy = new Proxy({}, {
        get(target, key) {
            const { setupState } = instance;
            if (key in setupState)
                return setupState[key];
        },
    });
    const { setup } = component;
    // 用户可能不写 setup
    if (setup) {
        const setupResult = setup();
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

function render(vnode, container) {
    // render 里只做 patch
    patch(vnode, container);
}
// 根据 vnode 的类型进行 组件/元素 的处理
function patch(vnode, container) {
    if (typeof vnode.type === 'string')
        processElement(vnode, container);
    else if (isObject(vnode))
        processComponent(vnode, container);
}
function processElement(vnode, container) {
    mountElement(vnode, container);
}
function mountElement(vnode, container) {
    const { type, props, children } = vnode;
    const el = document.createElement(type);
    // children: Array / String
    if (typeof children === 'string')
        el.textContent = children;
    else if (Array.isArray(children))
        mountChildren(vnode, el);
    // props
    for (const key in props)
        el.setAttribute(key, props[key]);
    container.append(el);
}
function mountChildren(vnode, container) {
    vnode.children.forEach((v) => {
        patch(v, container);
    });
}
function processComponent(vnode, container) {
    mountComponent(vnode, container);
}
function mountComponent(vnode, container) {
    // 根据 vnode 创建组件实例
    const instance = createComponentInstance(vnode);
    // 初始化组件实例
    setupComponent(instance);
    // 进行 render
    setupRenderEffect(instance, container);
}
function setupRenderEffect(instance, container) {
    const { proxy } = instance;
    const subTree = instance.render.apply(proxy);
    // vnode -> patch
    // vnode -> element -> patch
    patch(subTree, container);
}

function createVNode(type, props, children) {
    const vnode = {
        type,
        props,
        children,
    };
    return vnode;
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

export { createApp, h };
