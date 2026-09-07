// api/home.js —— 首页 / 主题 / 分类
const http = require('./http.js')

module.exports = {
  getHome() {
    return http.get('/home/index', {}, { loading: false })
  },
  getCategories() {
    return http.get('/category/list', {}, { loading: false })
  },
  getThemes() {
    return http.get('/theme/list', {}, { loading: false })
  },
  getThemeDetail(id) {
    return http.get('/theme/detail', { id: id }, { loading: false })
  },
  getSeckill() {
    return http.get('/promotion/seckill')
  },
  getSessions() {
    return http.get('/promotion/sessions', {}, { loading: false })
  },
  remind(sessionId) {
    return http.post('/seckill/remind', { sessionId: sessionId }, { loading: false })
  },
  getPromotionRules() {
    return http.get('/promotion/rules')
  }
}
