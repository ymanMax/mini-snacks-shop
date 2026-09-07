// api/group.js —— 拼团
const http = require('./http.js')

module.exports = {
  getList(tab) {
    return http.get('/group/list', { tab: tab || 'active' }, { loading: false })
  },
  getDetail(id) {
    return http.get('/group/detail', { id: id }, { loading: false })
  },
  open(goodsId, requiredCount) {
    return http.post('/group/open', { goodsId: goodsId, requiredCount: requiredCount || 3 }, { loadingText: '开团中...' })
  },
  join(id) {
    return http.post('/group/join', { id: id })
  },
  simulateJoin(id) {
    return http.post('/group/simulateJoin', { id: id }, { loadingText: '好友参团中...' })
  },
  inviteReward(id) {
    return http.post('/group/inviteReward', { id: id })
  },
  share(type, id) {
    return http.post('/share/record', { type: type, id: id }, { loading: false })
  }
}
