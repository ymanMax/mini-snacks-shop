// pages/order/review/review.js —— 订单评价
const orderApi = require('../../../api/order.js')
const shopApi = require('../../../api/shop.js')
const toast = require('../../../utils/toast.js')
const { starText } = require('../../../utils/format.js')

const STARS = [1, 2, 3, 4, 5]
const QUICK_TAGS = ['新鲜度高', '口感很棒', '包装精美', '分量十足', '物流很快', '会回购', '孩子爱吃', '性价比高']
const SHOP_DIMS = [
  { key: 'fresh', label: '商品新鲜' },
  { key: 'speed', label: '配送速度' },
  { key: 'package', label: '包装服务' }
]

Page({
  data: {
    orderId: null,
    order: null,
    goodsReviews: [],
    shop: { fresh: 5, speed: 5, package: 5, content: '' },
    starsArr: STARS,
    tagsArr: QUICK_TAGS,
    shopDims: SHOP_DIMS,
    submitting: false
  },

  onLoad(options) {
    const id = options.id
    this.setData({ orderId: id })
    orderApi.getDetail(id).then((o) => {
      if (o.isReviewed) {
        toast.showToast('该订单已评价')
        setTimeout(() => wx.navigateBack(), 800)
        return
      }
      const goodsReviews = o.items.map((it, i) => ({
        key: i,
        goodsId: it.goodsId,
        name: it.name,
        pic: it.pic,
        score: 5,
        scoreText: starText(5),
        tags: [],
        content: '',
        images: []
      }))
      this.setData({ order: o, goodsReviews: goodsReviews })
    }).catch((err) => toast.fail((err && err.msg) || '订单不存在'))
  },

  // 商品星级
  pickStar(e) {
    const { index, star } = e.currentTarget.dataset
    const key = 'goodsReviews[' + index + ']'
    const item = this.data.goodsReviews[index]
    item.score = star
    item.scoreText = starText(star)
    this.setData({ [key]: item })
  },

  toggleTag(e) {
    const { index, tag } = e.currentTarget.dataset
    const item = this.data.goodsReviews[index]
    const i = item.tags.indexOf(tag)
    if (i > -1) item.tags.splice(i, 1)
    else item.tags.push(tag)
    this.setData({ ['goodsReviews[' + index + ']']: item })
  },

  onContent(e) {
    const index = e.currentTarget.dataset.index
    this.setData({ ['goodsReviews[' + index + '].content']: e.detail.value })
  },

  chooseImg(e) {
    const index = e.currentTarget.dataset.index
    const item = this.data.goodsReviews[index]
    const remain = 6 - item.images.length
    if (remain <= 0) {
      toast.showToast('最多上传 6 张图片')
      return
    }
    wx.chooseMedia({
      count: remain,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        item.images = item.images.concat(res.tempFiles.map((f) => f.tempFilePath))
        this.setData({ ['goodsReviews[' + index + ']']: item })
      }
    })
  },

  removeImg(e) {
    const { index, imgIndex } = e.currentTarget.dataset
    const item = this.data.goodsReviews[index]
    item.images.splice(imgIndex, 1)
    this.setData({ ['goodsReviews[' + index + ']']: item })
  },

  previewImg(e) {
    const { index, url } = e.currentTarget.dataset
    wx.previewImage({ current: url, urls: this.data.goodsReviews[index].images })
  },

  // 店铺评分
  pickShopStar(e) {
    const { key, star } = e.currentTarget.dataset
    this.setData({ ['shop.' + key]: star })
  },
  onShopContent(e) {
    this.setData({ 'shop.content': e.detail.value })
  },

  submit() {
    if (this.data.submitting) return
    // 校验：每个商品都要打星（默认 5 星）；鼓励写内容
    const goods = this.data.goodsReviews.map((g) => ({
      goodsId: g.goodsId,
      name: g.name,
      pic: g.pic,
      score: g.score,
      tags: g.tags,
      content: g.content || '该用户觉得商品很不错，给出了好评！',
      images: g.images
    }))
    this.setData({ submitting: true })
    shopApi.submitReview({
      orderId: this.data.orderId,
      goods: goods,
      shop: {
        scores: { fresh: this.data.shop.fresh, speed: this.data.shop.speed, package: this.data.shop.package },
        content: this.data.shop.content
      }
    }).then((res) => {
      toast.success('评价成功，+' + res.points + ' 积分')
      setTimeout(() => wx.navigateBack(), 1000)
    }).catch((err) => {
      this.setData({ submitting: false })
      toast.fail((err && err.msg) || '提交失败')
    })
  }
})
