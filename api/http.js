/**
 * 全局统一请求入口（数据层收口）
 *
 * - USE_MOCK = true：所有请求不发 wx.request，改为匹配 mock/index.js 路由表，
 *   返回 Promise.resolve({ code: 200, data: ... })；
 * - USE_MOCK = false：走真实后端 BASE_URL，联调时只需把开关改为 false；
 * - 统一封装：全局 loading / toast、错误码处理、请求/响应拦截器、超时。
 *
 * 响应约定：{ code: 200, data, msg }；分页 data 为 { records, total, current, size }
 */
const toast = require('../utils/toast.js');

const USE_MOCK = true; // ★ 联调真实后端时改为 false
const BASE_URL = 'https://hanmashanghu.qiaomai365.com/api/v1';
const TIMEOUT = 10000;

const mock = require('../mock/index.js');

/* ---------- 拦截器（可按需扩展） ---------- */

/** 请求拦截器：注入 header / token */
function requestInterceptor(config) {
  const header = Object.assign({ 'Content-Type': 'application/json' }, config.header || {});
  let token = '';
  try { token = wx.getStorageSync('token') || ''; } catch (e) { /* ignore */ }
  if (token) header['Authorization'] = 'Bearer ' + token;
  config.header = header;
  return config;
}

/** 响应拦截器：统一错误码处理 */
function responseInterceptor(res, options) {
  if (res && res.code === 200) return res;
  const msg = (res && res.msg) || '请求失败，请稍后重试';
  if (res && (res.code === 401 || res.code === 403)) {
    // 登录态失效：Mock 环境下自动重新注入游客可浏览，不打断操作
    console.warn('[http] 登录态失效', msg);
  }
  if (options.showError !== false) toast.showError(msg);
  return Promise.reject(res || { code: -1, msg });
}

/* ---------- 真实请求（USE_MOCK=false 时） ---------- */
function realRequest(url, method, data, header) {
  return new Promise((resolve) => {
    wx.request({
      url: BASE_URL + url,
      method,
      data,
      header,
      timeout: TIMEOUT,
      success: (e) => resolve(e.data),
      fail: (err) => resolve({ code: -1, data: null, msg: (err && err.errMsg) || '网络异常' })
    });
  });
}

/**
 * 统一请求方法
 * @param {string} url 接口路径，如 '/goods/page'
 * @param {object} options
 *   - method: 'GET' | 'POST'（默认 GET）
 *   - data: 参数对象
 *   - loading: 是否显示全局 loading（默认 false，列表页建议用骨架屏）
 *   - loadingText: loading 文案
 *   - showError: 失败时是否自动 toast（默认 true）
 * @returns {Promise<{code:number,data:any,msg:string}>} resolve 完整响应体
 */
function request(url, options) {
  const opt = Object.assign({ method: 'GET', data: {}, loading: false, loadingText: '加载中...', showError: true }, options || {});
  if (opt.loading) toast.showLoading(opt.loadingText);

  let promise;
  if (USE_MOCK) {
    promise = mock.handle(url, opt.method, opt.data);
  } else {
    const cfg = requestInterceptor({ url, method: opt.method.toUpperCase(), data: opt.data, header: opt.header });
    promise = realRequest(cfg.url, cfg.method, cfg.data, cfg.header);
  }

  return promise.then((res) => {
    if (opt.loading) toast.hideLoading();
    return responseInterceptor(res, opt);
  }, (err) => {
    if (opt.loading) toast.hideLoading();
    return Promise.reject(err);
  });
}

/** GET 语法糖 */
function get(url, data, options) {
  return request(url, Object.assign({ method: 'GET', data }, options || {}));
}

/** POST 语法糖 */
function post(url, data, options) {
  return request(url, Object.assign({ method: 'POST', data }, options || {}));
}

/**
 * 统一上传（晒图等）：Mock 环境直接回传本地临时路径
 */
function upload(url, filePath, name, formData) {
  if (USE_MOCK) {
    return mock.handle(url || '/upload', 'POST', {}).then(() => ({ code: 200, data: { url: filePath }, msg: 'ok' }));
  }
  return new Promise((resolve) => {
    wx.uploadFile({
      url: BASE_URL + url,
      filePath,
      name: name || 'file',
      formData: formData || {},
      success: (e) => {
        try { resolve(JSON.parse(e.data)); } catch (err) { resolve({ code: -1, msg: '上传失败' }); }
      },
      fail: () => resolve({ code: -1, msg: '上传失败' })
    });
  });
}

module.exports = { request, get, post, upload, USE_MOCK, BASE_URL };
