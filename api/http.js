// api/http.js —— 全局统一数据请求入口
// USE_MOCK = true：内存 mock 路由，不发起真实网络请求；联调时改为 false 即走真实后端
const mock = require('../mock/index.js');
const toast = require('../utils/toast.js');

const USE_MOCK = true;
const BASE_URL = 'https://hanmashanghu.qiaomai365.com/api/v1';
const TIMEOUT = 10000;

function buildQuery(data) {
  if (!data) return '';
  const parts = [];
  Object.keys(data).forEach((k) => {
    const v = data[k];
    if (v === undefined || v === null || v === '') return;
    if (Array.isArray(v)) {
      v.forEach((item) => parts.push(encodeURIComponent(k) + '=' + encodeURIComponent(item)));
    } else {
      parts.push(encodeURIComponent(k) + '=' + encodeURIComponent(v));
    }
  });
  return parts.length ? '?' + parts.join('&') : '';
}

// 响应拦截：非 200 统一 toast（可 silent）
function handleResponse(res, options) {
  if (res && res.code === 200) {
    return options.raw ? res : res.data;
  }
  const msg = (res && res.msg) || '服务异常，请稍后再试';
  if (!options.silent) toast.showToast(msg);
  const err = new Error(msg);
  err.code = res ? res.code : -1;
  err.handled = true; // 已提示，handleError 不再重复 toast
  return Promise.reject(err);
}

function handleError(err, options) {
  if (err && err.handled) return Promise.reject(err);
  const msg = (err && err.errMsg && err.errMsg.indexOf('timeout') !== -1)
    ? '请求超时，请检查网络'
    : ((err && err.message) || '网络异常，请稍后再试');
  if (!options.silent) toast.showToast(msg);
  return Promise.reject(err instanceof Error ? err : new Error(msg));
}

/**
 * 统一请求
 * @param url 接口路径，如 /goods/page
 * @param data 参数：GET 拼 query，POST 作为 body
 * @param options { method, loading, silent, raw, header }
 */
function request(url, data = {}, options = {}) {
  const method = (options.method || 'GET').toUpperCase();
  if (options.loading) toast.showLoading(options.loadingText || '加载中...');

  let promise;
  if (USE_MOCK) {
    // Mock：按 url + method 匹配路由表，返回 Promise.resolve({ code, data, msg })
    const fullUrl = method === 'GET' ? url + buildQuery(data) : url;
    promise = mock.dispatch(fullUrl, method, data);
  } else {
    const app = getApp();
    const token = (app && app.globalData && app.globalData.token) || '';
    const fullUrl = method === 'GET' ? url + buildQuery(data) : url;
    promise = new Promise((resolve, reject) => {
      wx.request({
        url: BASE_URL + fullUrl,
        method,
        data: method === 'GET' ? {} : data,
        timeout: TIMEOUT,
        header: Object.assign({
          'content-type': 'application/json',
          'Authorization': token ? ('Bearer ' + token) : ''
        }, options.header || {}),
        success: resolve,
        fail: reject
      });
    });
  }

  return promise
    .then((res) => handleResponse(res, options))
    .catch((err) => handleError(err, options))
    .then((v) => {
      if (options.loading) toast.hideLoading();
      return v;
    }, (err) => {
      if (options.loading) toast.hideLoading();
      return Promise.reject(err);
    });
}

// 统一上传入口（mock 环境直接返回占位图）
function upload(filePath, formData = {}, options = {}) {
  if (options.loading) toast.showLoading('上传中...');
  let promise;
  if (USE_MOCK) {
    promise = mock.dispatch('/upload', 'POST', { filePath, formData });
  } else {
    const app = getApp();
    promise = new Promise((resolve, reject) => {
      wx.uploadFile({
        url: BASE_URL + '/upload',
        filePath,
        name: 'file',
        formData,
        header: { Authorization: (app.globalData && app.globalData.token) || '' },
        success: resolve,
        fail: reject
      });
    });
  }
  return promise.finally(() => options.loading && toast.hideLoading());
}

module.exports = {
  USE_MOCK,
  BASE_URL,
  request,
  upload,
  get: (url, data, options) => request(url, data, Object.assign({}, options, { method: 'GET' })),
  post: (url, data, options) => request(url, data, Object.assign({}, options, { method: 'POST' })),
  put: (url, data, options) => request(url, data, Object.assign({}, options, { method: 'PUT' })),
  del: (url, data, options) => request(url, data, Object.assign({}, options, { method: 'DELETE' }))
};
