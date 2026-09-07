// api/http.js —— 全局数据请求统一入口（优化 2）
// 红线：所有页面必须通过本模块取数；联调真实后端时仅需将 USE_MOCK 改为 false
const USE_MOCK = true;

const BASE_URL = 'https://hanmashanghu.qiaomai365.com/api/v1';
const TIMEOUT = 10000;
const mock = require('../mock/index.js');
const toast = require('../utils/toast.js');

// ---------- 请求拦截器 ----------
function requestInterceptor(options) {
  // 可在此注入 token 等公共参数
  options.header = Object.assign({ 'Content-Type': 'application/json' }, options.header || {});
  const token = wx.getStorageSync('token');
  if (token) options.header['Authorization'] = 'Bearer ' + token;
  return options;
}

// ---------- 响应拦截器 ----------
function responseInterceptor(res) {
  if (res && res.code === 200) return res.data;
  const msg = (res && res.msg) || '网络异常，请稍后重试';
  const err = new Error(msg);
  err.code = res && res.code;
  throw err;
}

/**
 * 统一请求
 * @param {string} url  接口路径，如 /goods/list
 * @param {string} method GET | POST
 * @param {object} data 查询或请求体
 * @param {object} op  { loading: 是否展示全局加载, errorToast: 失败是否自动提示(默认true) }
 */
function request(url, method = 'GET', data = {}, op = {}) {
  method = method.toUpperCase();
  const options = requestInterceptor({ url, method, data, header: op.header });
  if (op.loading) toast.showLoading(typeof op.loading === 'string' ? op.loading : '加载中...');

  const done = (promise) => promise
    .then(responseInterceptor)
    .catch(err => {
      if (op.errorToast !== false) toast.error(err.message || '网络异常');
      throw err;
    })
    .finally(() => {
      if (op.loading) toast.hideLoading();
    });

  if (USE_MOCK) {
    // Mock 模式：匹配 mock 路由表，内存返回（含 200~600ms 延迟）
    return done(mock.dispatch(options.url, options.method, options.data));
  }

  // 真实后端模式
  return done(new Promise((resolve, reject) => {
    wx.request({
      url: BASE_URL + options.url,
      method: options.method,
      data: options.data,
      header: options.header,
      timeout: TIMEOUT,
      success: res => resolve(res.data),
      fail: () => resolve({ code: -1, data: null, msg: '网络连接失败' })
    });
  }));
}

/**
 * 统一上传（Mock 模式下直接返回本地占位图）
 */
function upload(filePath, op = {}) {
  if (USE_MOCK) {
    return mock.dispatch('/upload', 'POST', {}).then(() => {
      // Mock：直接以本地路径作为"已上传"图片地址
      return { url: filePath };
    });
  }
  return new Promise((resolve, reject) => {
    wx.uploadFile({
      url: BASE_URL + '/upload',
      filePath,
      name: 'file',
      success: res => {
        try { resolve(JSON.parse(res.data).data); }
        catch (e) { reject(new Error('上传失败')); }
      },
      fail: () => reject(new Error('上传失败'))
    });
  });
}

module.exports = { USE_MOCK, request, upload, get: (url, data, op) => request(url, 'GET', data, op), post: (url, data, op) => request(url, 'POST', data, op) };
