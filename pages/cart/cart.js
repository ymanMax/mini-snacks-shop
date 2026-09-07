// pages/cart/cart.js —— 购物车
const cartApi = require('../../api/cart.js')
const orderApi = require('../../api/order.js')
const goodsApi = require('../../api/goods.js')
const toast = require('../../utils/toast.js')
const { formatPrice } = require('../../utils/format.js')

const app = getApp()

Page({
  data: {
    loading: true,
    valid: [],
    invalid: [],
    totalCount: 0,
    checkedCount: 0,
    checkedAmount: '￥0.00',
    allChecked: false,
    editMode: false,
    delIds: [],
    delAll: false,
    recommend: [],
    // 优惠/配送费预告
    preview: null,
    showDetail: false,
    payAmountText: '￥0.00',
    gapText: '',
    promo: null
  },

  onShow() {
    this.loadCart()
    if (!this._loadedHot) {
      this._loadedHot = true
      goodsApi.getHot(10).then((list) => this.setData({ recommend: list }))
    }
  },

  withPriceText(list) {
    return list.map((i) => Object.assign({}, i, {
      priceText: formatPrice(i.price),
      delChecked: this.data.delIds.indexOf(i.id) > -1
    }))
  },

  loadCart() {
    cartApi.getCart().then((view) => {
      this.setData({
        loading: false,
        valid: this.withPriceText(view.valid),
        invalid: this.withPriceText(view.invalid),
        totalCount: view.totalCount,
        checkedCount: view.checkedCount,
        checkedAmount: formatPrice(view.checkedAmount),
        allChecked: view.allChecked,
        delIds: [],
        delAll: false
      })
      this.refreshPreview(view)
      app.refreshCartBadge()
    }).catch(() => this.setData({ loading: false }))
  },

  // 优惠明细 / 配送费预告（基于默认地址实时试算）
  refreshPreview(view) {
    const items = (view || this.data).valid.filter((i) => i.checked)
    if (!items.length) {
      this.setData({ preview: null, payAmountText: '￥0.00', gapText: '' })
      return
    }
    const payload = items.map((i) => ({
      cartId: i.id,
      goodsId: i.goodsId,
      name: i.name,
      pic: i.pic,
      specText: i.specText,
      price: i.price,
      count: i.count
    }))
    orderApi.preview({ items: payload }).then((p) => {
      const freeThreshold = p.freeThreshold
      const gap = p.freight > 0 ? Math.max(0, freeThreshold - (p.goodsTotal - p.discountAmount)) : 0
      // 满减阶梯进度
      const promo = this.buildPromo(p)
      this.setData({
        preview: p,
        payAmountText: formatPrice(p.payAmount),
        gapText: gap > 0 ? '再买 ' + formatPrice(gap, false) + ' 元免基础配送费' : '已享免基础配送费',
        promo: promo
      })
    }).catch(() => {})
  },

  // 满减阶梯凑单进度
  buildPromo(p) {
    const rules = p.ladders.rules
    const total = p.goodsTotal
    const next = p.ladders.next
    const steps = rules.map((r) => ({
      threshold: r.threshold,
      reduce: r.reduce,
      reached: total >= r.threshold,
      label: '满' + r.threshold + '减' + r.reduce
    }))
    return {
      steps: steps,
      next: next,
      gapText: next ? '再买 ￥' + next.gap.toFixed(2) + ' 可减 ￥' + next.reduce : '已享最高满减',
      bestCoupon: p.bestCoupon,
      bestCouponText: p.bestCoupon ? '￥' + p.bestCoupon.amount.toFixed(2) : '',
      couponCount: p.usableCoupons.length,
      freeShipGap: p.freeShipGap,
      freeShipText: p.freeShipGap > 0
        ? '再买 ￥' + p.freeShipGap.toFixed(2) + ' 免基础配送费'
        : '已享免基础配送费'
    }
  },

  // ---- 选择 ----
  toggleItem(e) {
    const id = e.currentTarget.dataset.id
    if (this.data.editMode) {
      const delIds = this.data.delIds.slice()
      const i = delIds.indexOf(id)
      if (i > -1) delIds.splice(i, 1)
      else delIds.push(id)
      const valid = this.data.valid.map((it) => Object.assign({}, it, { delChecked: delIds.indexOf(it.id) > -1 }))
      this.setData({
        delIds: delIds,
        delAll: delIds.length === this.data.valid.length,
        valid: valid
      })
      return
    }
    const item = this.data.valid.find((x) => x.id === id)
    cartApi.update({ id: id, checked: !item.checked }).then((view) => this.applyView(view))
  },

  toggleAll() {
    if (this.data.editMode) {
      const all = !this.data.delAll
      const delIds = all ? this.data.valid.map((i) => i.id) : []
      const valid = this.data.valid.map((it) => Object.assign({}, it, { delChecked: all }))
      this.setData({ delAll: all, delIds: delIds, valid: valid })
      return
    }
    cartApi.toggleAll(!this.data.allChecked).then((view) => this.applyView(view))
  },

  // ---- 数量 ----
  onCount(e) {
    const id = e.currentTarget.dataset.id
    cartApi.update({ id: id, count: e.detail.value }).then((view) => this.applyView(view))
  },

  applyView(view) {
    this.setData({
      valid: this.withPriceText(view.valid),
      invalid: this.withPriceText(view.invalid),
      totalCount: view.totalCount,
      checkedCount: view.checkedCount,
      checkedAmount: formatPrice(view.checkedAmount),
      allChecked: view.allChecked
    })
    this.refreshPreview(view)
    app.refreshCartBadge()
  },

  // ---- 删除 ----
  removeOne(e) {
    const id = e.currentTarget.dataset.id
    toast.confirm('确定删除该商品吗？').then((ok) => {
      if (!ok) return
      cartApi.remove([id]).then((view) => {
        toast.success('已删除')
        this.applyView(view)
      })
    })
  },

  batchDelete() {
    const ids = this.data.delIds
    if (!ids.length) {
      toast.showToast('请选择要删除的商品')
      return
    }
    toast.confirm('确定删除选中的 ' + ids.length + ' 件商品吗？').then((ok) => {
      if (!ok) return
      cartApi.remove(ids).then((view) => {
        toast.success('已删除')
        this.setData({ editMode: false, delIds: [] })
        this.applyView(view)
      })
    })
  },

  toggleEdit() {
    this.setData({ editMode: !this.data.editMode, delIds: [], delAll: false, showDetail: false })
  },

  clearInvalid() {
    if (!this.data.invalid.length) return
    toast.confirm('确定清空失效商品吗？').then((ok) => {
      if (!ok) return
      cartApi.clearInvalid().then((view) => {
        toast.success('已清空')
        this.applyView(view)
      })
    })
  },

  toggleDetail() {
    this.setData({ showDetail: !this.data.showDetail })
  },

  noop() {},

  // ---- 跳转 ----
  goDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: '/pages/detail/detail?id=' + id })
  },
  goShopping() {
    wx.switchTab({ url: '/pages/classic/classic' })
  },
  goCheckout() {
    if (!this.data.checkedCount) {
      toast.showToast('请先选择要结算的商品')
      return
    }
    wx.navigateTo({ url: '/pages/order/confirm/confirm?from=cart' })
  },
  goRecommend(e) {
    wx.navigateTo({ url: '/pages/detail/detail?id=' + e.detail.item.id })
  },
  goCoupon() {
    wx.navigateTo({ url: '/pages/coupon/mine/mine' })
  }
})
