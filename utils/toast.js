// utils/toast.js —— 全局 toast / loading / modal 统一封装
let loadingCount = 0;

function showToast(title, icon = 'none', duration = 1800) {
  wx.showToast({
    title: String(title || ''),
    icon,
    duration,
    mask: false
  });
}

function showSuccess(title) {
  showToast(title || '操作成功', 'success', 1500);
}

function showLoading(title = '加载中...', mask = true) {
  loadingCount++;
  wx.showLoading({ title, mask });
}

function hideLoading() {
  loadingCount = Math.max(0, loadingCount - 1);
  if (loadingCount === 0) wx.hideLoading();
}

// Promise 化的确认弹框
function showModal(content, title = '提示', options = {}) {
  return new Promise((resolve) => {
    wx.showModal({
      title,
      content,
      confirmText: options.confirmText || '确定',
      confirmColor: '#b4282d',
      cancelText: options.cancelText || '取消',
      showCancel: options.showCancel !== false,
      success: (res) => resolve(!!res.confirm),
      fail: () => resolve(false)
    });
  });
}

module.exports = {
  showToast,
  showSuccess,
  showLoading,
  hideLoading,
  showModal
};
