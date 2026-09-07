// utils/toast.js —— 统一 Toast / Loading 封装（优化 9）
function showToast(title, icon = 'none', duration = 2000) {
  wx.showToast({ title: String(title), icon, duration });
}

function success(title = '操作成功') {
  showToast(title, 'success');
}

function error(title = '操作失败，请稍后重试') {
  showToast(title, 'none');
}

function showLoading(title = '加载中...') {
  wx.showLoading({ title, mask: true });
}

function hideLoading() {
  wx.hideLoading();
}

// 二次确认，resolve(true/false)
function confirm(content, title = '提示') {
  return new Promise(resolve => {
    wx.showModal({
      title,
      content,
      success: res => resolve(!!res.confirm),
      fail: () => resolve(false)
    });
  });
}

module.exports = { showToast, success, error, showLoading, hideLoading, confirm };
