// pages/member/center/center.js —— 会员中心
const memberApi = require('../../../api/member.js')
const toast = require('../../../utils/toast.js')

Page({
  data: {
    info: null,
    levels: [],
    claiming: false
  },

  onShow() {
    this.load()
  },

  load() {
    Promise.all([memberApi.getInfo(), memberApi.getLevels()]).then((res) => {
      const info = res[0]
      const levels = res[1].levels.map((l) => Object.assign({}, l, {
        current: l.level === info.user.level,
        passed: l.level <= info.user.level
      }))
      this.setData({ info: info, levels: levels })
    })
  },

  claimBirthday() {
    if (this.data.claiming) return
    if (!this.data.info.isBirthdayMonth) {
      toast.showToast('生日当月才可领取生日礼包哦')
      return
    }
    this.setData({ claiming: true })
    memberApi.claimBirthdayGift().then((res) => {
      toast.success('已领取：' + res.gift.title)
      this.setData({ claiming: false })
      this.load()
    }).catch((err) => {
      this.setData({ claiming: false })
      toast.showToast((err && err.msg) || '领取失败')
    })
  },

  go(e) {
    wx.navigateTo({ url: e.currentTarget.dataset.url })
  }
})
