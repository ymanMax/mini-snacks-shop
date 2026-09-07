// api/user.js —— 用户
const http = require('./http.js')

module.exports = {
  getInfo() {
    return http.get('/user/info', {}, { loading: false })
  },
  login() {
    return http.post('/user/login', {}, { loadingText: '登录中...' })
  },
  logout() {
    return http.post('/user/logout', {}, { loading: false })
  },
  update(data) {
    return http.post('/user/update', data, { loading: false })
  },
  resetCache() {
    return http.post('/user/resetCache', {}, { loadingText: '清理中...' })
  }
}
