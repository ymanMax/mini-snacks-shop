/**
 * 全局 Toast / Loading 统一封装
 * 所有页面禁止直接调用 wx.showToast / wx.showLoading，统一走本模块
 */

let loadingCount = 0;

/**
 * @param {string} title 提示文案
 * @param {string} icon success | error | loading | none
 * @param {number} duration 毫秒
 */
function showToast(title, icon = 'none', duration = 2000) {
  if (!title) return;
  wx.showToast({
    title: String(title).slice(0, 30),
    icon,
    duration,
    mask: false
  });
}

function showSuccess(title = '操作成功') {
  showToast(title, 'success', 1500);
}

function showError(title = '操作失败，请稍后重试') {
  showToast(title, 'none', 2000);
}

function showLoading(title = '加载中...') {
  loadingCount++;
  wx.showLoading({ title, mask: true });
}

function hideLoading() {
  loadingCount = Math.max(0, loadingCount - 1);
  if (loadingCount === 0) {
    wx.hideLoading();
  }
}

/** 强制关闭 loading（页面 onUnload 兜底） */
function hideLoadingForce() {
  loadingCount = 0;
  wx.hideLoading();
}

/** 模态确认框，返回 Promise<boolean> */
function confirm(content, title = '提示') {
  return new Promise((resolve) => {
    wx.showModal({
      title,
      content,
      confirmColor: '#b4282d',
      success: (res) => resolve(!!res.confirm),
      fail: () => resolve(false)
    });
  });
}

/** 模态提示框（仅确定按钮），返回 Promise */
function alert(content, title = '提示') {
  return new Promise((resolve) => {
    wx.showModal({
      title,
      content,
      showCancel: false,
      confirmColor: '#b4282d',
      success: () => resolve(true),
      fail: () => resolve(false)
    });
  });
}

module.exports = {
  showToast,
  showSuccess,
  showError,
  showLoading,
  hideLoading,
  hideLoadingForce,
  confirm,
  alert
};
