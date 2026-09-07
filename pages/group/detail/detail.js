// pages/group/detail/detail.js —— 拼团详情
const groupApi = require('../../../api/group.js')
const { countdown, formatPrice } = require('../../../utils/format.js')
const toast = require('../../../utils/toast.js')

const app = getApp()

Page({
  data: {
    id: null,
    group: null,
    cdText: '',
    loading: true,
    successVisible: false,
    rewardVisible: false,
    steps: [
      { title: '发起拼团', desc: '好友开团', done: true },
      { title: '邀请参团', desc: '邀请好友', done: false },
      { title: '拼团成功', desc: '达到人数', done: false },
      { title: '商家发货', desc: '极速送达', done: false }
    ]
  },

  buildSteps(g) {
    return [
      { title: '发起拼团', desc: '好友开团', done: g.joinedCount >= 1 },
      { title: '邀请参团', desc: '邀请好友', done: g.joinedCount >= 2 },
      { title: '拼团成功', desc: '达到人数', done: g.status === 2 },
      { title: '商家发货', desc: '极速送达', done: g.status === 2 }
    ]
  },

  onLoad(options) {
    this.setData({ id: options.id })
    // 从分享卡片进入时记录邀请人（演示用）
    if (options.inviter) app.globalData.inviter = options.inviter
    this.load()
    this._timer = setInterval(() => this.tick(), 1000)
    this.tick()
  },

  onUnload() {
    if (this._timer) clearInterval(this._timer)
  },

  onShow() {
    if (this._loaded) this.load(true)
    this._loaded = true
  },

  load(silent) {
    groupApi.getDetail(this.data.id).then((g) => {
      g.groupText = formatPrice(g.groupPrice)
      g.origText = formatPrice(g.originalPrice, false)
      this.setData({ group: g, steps: this.buildSteps(g), loading: false })
      if (g.status === 2 && !silent && !this._shownSuccess) {
        this._shownSuccess = true
        this.setData({ successVisible: true, rewardVisible: g.mine })
      }
      this.tick()
    }).catch((err) => {
      this.setData({ loading: false })
      toast.showToast((err && err.msg) || '拼团不存在')
    })
  },

  tick() {
    const g = this.data.group
    if (!g || g.status !== 1) return
    const c = countdown(g.endTime - Date.now())
    this.setData({ cdText: c.text })
  },

  // 参团/开团后参团
  join() {
    groupApi.join(this.data.id).then((res) => {
      toast.success(res.completed ? '拼团成功！' : '参团成功')
      if (res.completed) {
        this.setData({ successVisible: true, rewardVisible: true })
      }
      this.load(true)
    }).catch((err) => toast.showToast((err && err.msg) || '参团失败'))
  },

  // 演示：模拟一位好友参团
  simulateJoin() {
    groupApi.simulateJoin(this.data.id).then((res) => {
      toast.success('好友已参团')
      if (res.completed) {
        this.setData({ successVisible: true, rewardVisible: true })
      }
      this.load(true)
    }).catch((err) => toast.showToast((err && err.msg) || '操作失败'))
  },

  // 邀请奖励（券+积分，每团一次）
  claimReward() {
    groupApi.inviteReward(this.data.id).then((res) => {
      toast.success('获得 ' + res.points + ' 积分与 ' + res.couponName)
      this.setData({ rewardVisible: false })
    }).catch((err) => toast.showToast((err && err.msg) || '已领取过奖励'))
  },

  closeSuccess() {
    this.setData({ successVisible: false })
  },

  onShareAppMessage() {
    const g = this.data.group
    const u = wx.getStorageSync('userInfo') || {}
    groupApi.share('group', g.id).then((res) => {
      if (res.rewarded) toast.showToast('分享成功，获得 10 积分')
    }).catch(() => {})
    return {
      title: g.name + ' ' + g.groupText + ' 拼团中，差' + g.remain + '人成团，快来！',
      path: '/pages/group/detail/detail?id=' + g.id + '&inviter=' + (u.id || 0),
      imageUrl: g.pic
    }
  },

  goGoods() {
    wx.redirectTo({ url: '/pages/detail/detail?id=' + this.data.group.goodsId })
  },
  goHome() {
    wx.switchTab({ url: '/pages/index/index' })
  },
  goOrders() {
    wx.redirectTo({ url: '/pages/order/list/list' })
  }
})
