// pages/order/confirm/confirm.js —— 订单确认
const cartApi = require('../../../api/cart.js')
const orderApi = require('../../../api/order.js')
const addressApi = require('../../../api/address.js')
const shopApi = require('../../../api/shop.js')
const toast = require('../../../utils/toast.js')
const { formatPrice } = require('../../../utils/format.js')

const app = getApp()

Page({
  data: {
    from: 'cart',
    items: [],
    address: null,
    slots: [],
    slotIndex: 0,
    slotText: '',
    coupon: null,
    autoCoupon: true,
    remark: '',
    payType: 1,
    pricing: null,
    goodsTotalText: '￥0.00',
    discountText: '-￥0.00',
    freightText: '￥0.00',
    payText: '￥0.00',
    fullReduceText: '￥0.00',
    couponDiscountText: '￥0.00',
    outRange: false,
    submitting: false
  },

  onLoad(options) {
    this.setData({ from: options.from || 'cart' })
    if (this.data.from === 'buyNow') {
      this.setData({ items: (app.globalData.buyNow || []).slice() })
      app.globalData.buyNow = null
    }
    shopApi.getInfo().then((shop) => this.setData({ slots: shop.deliverySlots, slotText: shop.deliverySlots[0] }))
  },

  onShow() {
    // 从地址选择器带回
    const addressId = wx.getStorageSync('selectedAddressId')
    // 从优惠券页带回（null 表示明确不使用券）
    const couponPick = wx.getStorageSync('selectedCoupon')
    if (couponPick !== '') {
      this.setData({ autoCoupon: false, coupon: couponPick || null })
    }
    wx.removeStorageSync('selectedCoupon')
    // 从时段页带回
    const slot = wx.getStorageSync('selectedSlot')
    if (slot) {
      this.setData({ slotText: slot.text, slotIndex: slot.index })
      wx.removeStorageSync('selectedSlot')
    }

    const jobs = [addressApi.getList()]
    if (this.data.from === 'cart') jobs.push(cartApi.getCart())
    Promise.all(jobs).then((res) => {
      const addresses = res[0]
      const cart = res[1]
      let addr
      if (addressId) addr = addresses.find((a) => a.id === addressId)
      if (!addr) addr = addresses.find((a) => a.isDefault) || addresses[0]
      this.setData({ address: addr || null })
      if (addressId) wx.removeStorageSync('selectedAddressId')

      if (this.data.from === 'cart') {
        const checked = cart.valid.filter((i) => i.checked).map((i) => ({
          cartId: i.id,
          goodsId: i.goodsId,
          name: i.name,
          pic: i.pic,
          specText: i.specText,
          price: i.price,
          count: i.count
        }))
        this.setData({ items: this.decorateItems(checked) })
        app.globalData.orderItems = checked
        if (!checked.length) {
          toast.showToast('请先选择要结算的商品')
          setTimeout(() => wx.navigateBack(), 800)
          return
        }
      } else if (!this._decorated) {
        this._decorated = true
        this.setData({ items: this.decorateItems(this.data.items) })
        app.globalData.orderItems = this.data.items
      }
      this.recompute()
    })
  },

  decorateItems(items) {
    return items.map((i) => Object.assign({}, i, {
      priceText: formatPrice(i.price),
      subText: formatPrice(i.price * i.count)
    }))
  },

  buildPayload() {
    return this.data.items.map((i) => ({
      cartId: i.cartId,
      goodsId: i.goodsId,
      name: i.name,
      pic: i.pic,
      specText: i.specText,
      price: i.price,
      count: i.count
    }))
  },

  recompute() {
    if (!this.data.items.length) return
    const payload = this.buildPayload()
    const couponInstanceId = this.data.autoCoupon
      ? (this.data.coupon ? this.data.coupon.instanceId : null)
      : (this.data.coupon ? this.data.coupon.instanceId : null)
    this.previewOnce(payload, this.data.address ? this.data.address.id : null, couponInstanceId, true)
  },

  previewOnce(payload, addressId, couponInstanceId, allowAuto) {
    orderApi.preview({ items: payload, addressId: addressId, couponInstanceId: couponInstanceId })
      .then((p) => {
        // 自动最优券：首次未指定券但系统推荐了最优券时，二次试算
        if (allowAuto && this.data.autoCoupon && p.bestCoupon &&
          (!this.data.coupon || this.data.coupon.instanceId !== p.bestCoupon.instanceId)) {
          return orderApi.preview({
            items: payload,
            addressId: addressId,
            couponInstanceId: p.bestCoupon.instanceId
          }).then((p2) => {
            this.applyPricing(p2, { instanceId: p.bestCoupon.instanceId, name: p.bestCoupon.name })
          })
        }
        this.applyPricing(p, this.data.coupon)
      })
  },

  applyPricing(p, couponObj) {
    if (p.outRange) {
      toast.showToast('该地址超出配送范围')
    }
    if (p.coupon && !couponObj) couponObj = { instanceId: p.coupon.instanceId, name: p.coupon.name }
    if (!p.coupon) couponObj = null
    this.setData({
      pricing: p,
      address: p.address || this.data.address,
      coupon: couponObj,
      outRange: p.outRange,
      goodsTotalText: formatPrice(p.goodsTotal),
      fullReduceText: '￥' + p.fullReduce.toFixed(2),
      couponDiscountText: '￥' + p.couponDiscount.toFixed(2),
      discountText: '-￥' + p.discountAmount.toFixed(2),
      freightText: p.outRange ? '不可配送' : (p.freight === 0 ? '免配送费' : formatPrice(p.freight)),
      payText: p.outRange ? '不可配送' : formatPrice(p.payAmount)
    })
  },

  // ---------- 选择 ----------
  chooseAddress() {
    wx.navigateTo({ url: '/pages/address/picker/picker?from=confirm' })
  },
  addAddress() {
    wx.navigateTo({ url: '/pages/newAddress/newAddress?from=confirm' })
  },
  chooseSlot() {
    wx.navigateTo({
      url: '/pages/order/slot/slot?index=' + this.data.slotIndex
    })
  },
  chooseCoupon() {
    const amount = this.data.pricing ? this.data.pricing.goodsTotal - this.data.pricing.fullReduce : 0
    wx.navigateTo({ url: '/pages/coupon/mine/mine?from=confirm&amount=' + amount })
  },
  clearCoupon() {
    this.setData({ autoCoupon: false, coupon: null })
    wx.setStorageSync('selectedCoupon', null)
    this.recompute()
  },
  onRemark(e) {
    this.setData({ remark: e.detail.value })
  },
  pickPay(e) {
    this.setData({ payType: Number(e.currentTarget.dataset.type) })
  },

  // ---------- 提交 ----------
  submit() {
    if (this.data.submitting) return
    if (!this.data.address) {
      toast.showToast('请先添加收货地址')
      return
    }
    if (this.data.outRange) {
      toast.showToast('该地址暂不支持配送，请更换地址')
      return
    }
    this.setData({ submitting: true })
    const order = {
      from: this.data.from,
      items: this.buildPayload(),
      addressId: this.data.address.id,
      couponInstanceId: this.data.coupon ? this.data.coupon.instanceId : null,
      remark: this.data.remark,
      slot: this.data.slotText,
      payType: this.data.payType
    }
    const afterCreate = (o) => {
      if (this.data.payType === 2) {
        toast.success('下单成功，货到付款')
        wx.redirectTo({ url: '/pages/order/detail/detail?id=' + o.id })
        return
      }
      orderApi.pay(o.id).then(() => {
        toast.success('支付成功')
        getApp().refreshCartBadge()
        wx.redirectTo({ url: '/pages/order/detail/detail?id=' + o.id })
      }).catch(() => {
        this.setData({ submitting: false })
      })
    }
    orderApi.create(order).then(afterCreate).catch(() => {
      this.setData({ submitting: false })
    })
  }
})
