// utils/bus.js —— 极简跨页面事件总线（购物车角标、收藏态等同步）
const listeners = {}

function on(event, handler) {
  if (!listeners[event]) listeners[event] = []
  listeners[event].push(handler)
  return () => off(event, handler)
}

function off(event, handler) {
  const arr = listeners[event]
  if (!arr) return
  const i = arr.indexOf(handler)
  if (i > -1) arr.splice(i, 1)
}

function emit(event, payload) {
  const arr = listeners[event]
  if (!arr) return
  arr.slice().forEach((fn) => {
    try { fn(payload) } catch (e) { console.error('bus handler error', e) }
  })
}

// 全局事件名
const EVENTS = {
  CART_CHANGE: 'cartChange',
  COLLECT_CHANGE: 'collectChange'
}

module.exports = { on, off, emit, EVENTS }
