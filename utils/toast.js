// utils/toast.js —— 全局 Toast / Loading / Modal 统一封装
let loadingCount = 0

function showToast(title, icon, duration) {
  wx.showToast({
    title: String(title == null ? '' : title),
    icon: icon || 'none',
    duration: duration || 1800,
    mask: false
  })
}

function success(title) {
  showToast(title || '操作成功', 'success', 1500)
}

function fail(title) {
  showToast(title || '操作失败，请稍后再试', 'none')
}

function showLoading(title) {
  loadingCount++
  wx.showLoading({
    title: title || '加载中...',
    mask: true
  })
}

function hideLoading() {
  loadingCount = Math.max(0, loadingCount - 1)
  if (loadingCount === 0) wx.hideLoading()
}

// Promise 化确认框，确认 resolve(true)
function confirm(content, title, options) {
  options = options || {}
  return new Promise((resolve) => {
    wx.showModal({
      title: title || '提示',
      content: content || '',
      confirmText: options.confirmText || '确定',
      cancelText: options.cancelText || '取消',
      confirmColor: '#b4282d',
      success(res) {
        resolve(!!res.confirm)
      },
      fail() {
        resolve(false)
      }
    })
  })
}

function alert(content, title) {
  return new Promise((resolve) => {
    wx.showModal({
      title: title || '提示',
      content: content || '',
      showCancel: false,
      confirmColor: '#b4282d',
      success() {
        resolve(true)
      }
    })
  })
}

module.exports = {
  showToast,
  success,
  fail,
  showLoading,
  hideLoading,
  confirm,
  alert
}
