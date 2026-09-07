// api/http.js —— 全局统一请求入口
// 联调真实后端时，仅需将 USE_MOCK 改为 false 并配置 BASE_URL
const USE_MOCK = true
const BASE_URL = 'https://api.example.com/v1'

const mock = require('../mock/index.js')
const toast = require('../utils/toast.js')

// ---------- 请求拦截 ----------
function requestInterceptor(options) {
  const header = Object.assign({
    'Content-Type': 'application/json'
  }, options.header || {})
  let userInfo = null
  try {
    userInfo = wx.getStorageSync('userInfo')
  } catch (e) {
    userInfo = null
  }
  if (userInfo && userInfo.id) {
    header['X-User-Id'] = userInfo.id
  }
  return Object.assign({}, options, { header })
}

// ---------- 响应拦截 ----------
function responseInterceptor(body) {
  // 约定：成功 { code: 200, data, msg }，分页 data: { records, total, current, size }
  if (body && body.code === 200) {
    return body.data
  }
  const msg = (body && body.msg) || '网络开小差了，请稍后再试'
  return Promise.reject({
    code: body ? body.code : -1,
    msg: msg,
    data: body ? body.data : null
  })
}

function realRequest(options) {
  return new Promise((resolve, reject) => {
    wx.request({
      url: BASE_URL + options.url,
      method: options.method || 'GET',
      data: options.data || {},
      header: options.header,
      timeout: 10000,
      success(res) {
        resolve(res)
      },
      fail(err) {
        reject({ code: -1, msg: '网络连接失败，请检查网络设置', raw: err })
      }
    })
  })
}

/**
 * 统一请求
 * @param {Object} options { url, method, data, loading, showError, header, loadingText }
 */
function request(options) {
  const opts = requestInterceptor({
    method: 'GET',
    loading: true,
    showError: true,
    data: {},
    ...options
  })
  if (opts.loading) toast.showLoading(opts.loadingText || '加载中...')

  const flow = USE_MOCK
    ? mock.dispatch(opts.method, opts.url, opts.data || {})
      .then((body) => ({ data: body }))
    : realRequest(opts)

  return flow
    .then((res) => responseInterceptor(res.data))
    .catch((err) => {
      if (opts.showError) {
        toast.showToast((err && err.msg) || '网络开小差了，请稍后再试')
      }
      return Promise.reject(err)
    })
    .then((data) => {
      if (opts.loading) toast.hideLoading()
      return data
    }, (err) => {
      if (opts.loading) toast.hideLoading()
      return Promise.reject(err)
    })
}

function get(url, data, opts) {
  return request(Object.assign({ url: url, method: 'GET', data: data || {} }, opts))
}

function post(url, data, opts) {
  return request(Object.assign({ url: url, method: 'POST', data: data || {} }, opts))
}

// 上传：Mock 环境直接回传本地临时路径；真实环境走 wx.uploadFile
function upload(filePath, formData) {
  if (USE_MOCK) {
    return new Promise((resolve) => {
      setTimeout(() => resolve({ url: filePath }), 300)
    })
  }
  return new Promise((resolve, reject) => {
    wx.uploadFile({
      url: BASE_URL + '/upload',
      filePath: filePath,
      name: 'file',
      formData: formData || {},
      success(res) {
        try {
          const body = JSON.parse(res.data)
          if (body.code === 200) resolve(body.data)
          else reject(body)
        } catch (e) {
          reject({ msg: '上传响应解析失败' })
        }
      },
      fail: reject
    })
  })
}

module.exports = {
  USE_MOCK: USE_MOCK,
  BASE_URL: BASE_URL,
  request: request,
  get: get,
  post: post,
  upload: upload
}
