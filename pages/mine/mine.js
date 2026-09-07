// pages/mine/mine.js —— 个人中心
const memberApi = require('../../api/member.js')
const orderApi = require('../../api/order.js')
const messageApi = require('../../api/message.js')
const userApi = require('../../api/user.js')
const shopApi = require('../../api/shop.js')
const http = require('../../api/http.js')
const toast = require('../../utils/toast.js')

const app = getApp()

Page({
  data: {
    member: null,
    isGuest: false,
    counts: { pay: 0, send: 0, delivery: 0, receive: 0, review: 0 },
    checkinRed: false,
    unread: 0,
    deliveryRule: null,
    // 弹层
    serviceVisible: false,
    aboutVisible: false,
    deliveryVisible: false,
    serviceMsgs: [
      { me: false, text: '您好，这里是零食商城在线客服，请问有什么可以帮您？' }
    ],
    serviceInput: ''
  },

  onShow() {
    this.loadAll()
  },

  loadAll() {
    memberApi.getInfo().then((info) => {
      wx.setStorageSync('userInfo', info.isGuest
        ? { id: 0, nickName: '游客', avatar: info.user.avatar, level: 0, points: 0, growthValue: 0 }
        : info.user)
      app.globalData.userInfo = info.user
      this.setData({ member: info, isGuest: info.isGuest })
    })
    orderApi.getCounts().then((c) => this.setData({ counts: c }))
    memberApi.getCheckinInfo().then((c) => this.setData({ checkinRed: !c.state.todaySigned })).catch(() => {})
    messageApi.getUnreadCount().then((r) => this.setData({ unread: r.count })).catch(() => {})
    shopApi.getInfo().then((s) => this.setData({ deliveryRule: s.deliveryRule })).catch(() => {})
    app.refreshCartBadge()
  },

  // ---------- 登录 ----------
  login() {
    userApi.login().then(() => {
      toast.success('登录成功')
      this.loadAll()
    })
  },

  logout() {
    toast.confirm('确定退出登录吗？退出后仍可以游客身份浏览。', '退出登录').then((ok) => {
      if (!ok) return
      userApi.logout().then(() => {
        toast.showToast('已退出登录')
        this.loadAll()
      })
    })
  },

  // ---------- 头像 ----------
  changeAvatar() {
    if (this.data.isGuest) return this.login()
    wx.showActionSheet({
      itemList: ['从相册选择头像', '随机一个头像'],
      success: (res) => {
        if (res.tapIndex === 0) {
          wx.chooseMedia({
            count: 1,
            mediaType: ['image'],
            success: (r) => {
              const path = r.tempFiles[0].tempFilePath
              http.upload(path).then((f) => userApi.update({ avatar: f.url })).then(() => {
                toast.success('头像已更新')
                this.loadAll()
              })
            }
          })
        } else {
          const n = Math.floor(Math.random() * 6) + 1
          const avatar = '/static/mock/avatar/av0' + n + '.png'
          userApi.update({ avatar: avatar }).then(() => {
            toast.success('头像已更新')
            this.loadAll()
          })
        }
      }
    })
  },

  // ---------- 跳转 ----------
  navigate(e) {
    const { url, type } = e.currentTarget.dataset
    if (!url) return
    if (type === 'tab') wx.switchTab({ url })
    else wx.navigateTo({ url })
  },

  goOrderList(e) {
    const status = e.currentTarget.dataset.status || 0
    wx.navigateTo({ url: '/pages/order/list/list?status=' + status })
  },

  // ---------- 设置 ----------
  openSettings() {
    wx.showActionSheet({
      itemList: ['清除缓存（重置演示数据）', this.data.isGuest ? '登录账号' : '退出登录'],
      success: (res) => {
        if (res.tapIndex === 0) this.clearCache()
        else if (this.data.isGuest) this.login()
        else this.logout()
      }
    })
  },

  clearCache() {
    toast.confirm('将清空购物车、订单等演示数据并恢复初始状态，是否继续？', '清除缓存').then((ok) => {
      if (!ok) return
      userApi.resetCache().then(() => {
        wx.removeStorageSync('search_history')
        app.refreshCartBadge()
        toast.success('缓存已清除')
        this.loadAll()
      })
    })
  },

  // ---------- 弹层 ----------
  openAbout() {
    this.setData({ aboutVisible: true })
  },
  openDelivery() {
    this.setData({ deliveryVisible: true })
  },
  closeMask() {
    this.setData({ aboutVisible: false, deliveryVisible: false })
  },
  noop() {},

  onShareAppMessage() {
    return {
      title: '零食商城·直营店 —— 网红零食一站购齐',
      path: '/pages/index/index'
    }
  }
})
