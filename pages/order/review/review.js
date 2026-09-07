// pages/order/review/review.js —— 逐商品评价 + 店铺三维度评价，提交赠 20 积分
const { orderApi } = require('../../../api/index.js');
const toast = require('../../../utils/toast.js');

const QUICK_TAGS = ['很新鲜', '口感好', '包装精美', '分量足', '物流很快', '会回购'];
const SHOP_DIMS = [
  { key: 'fresh', label: '商品新鲜' },
  { key: 'speed', label: '配送速度' },
  { key: 'package', label: '包装完好' }
];

Page({
  data: {
    id: null,
    order: null,
    goodsReviews: [],
    quickTags: QUICK_TAGS,
    shopDims: SHOP_DIMS,
    shopScores: { fresh: 5, speed: 5, package: 5 },
    shopContent: '',
    submitting: false
  },

  onLoad(options) {
    this.setData({ id: options.id });
    orderApi.getDetail(options.id).then((order) => {
      const goodsReviews = order.items.map((it, i) => ({
        goodsId: it.goodsId,
        name: it.name,
        pic: it.pic,
        score: 5,
        tagOptions: QUICK_TAGS.map((t) => ({ label: t, checked: false })),
        tags: [],
        content: '',
        images: [],
        key: i
      }));
      this.setData({ order, goodsReviews });
    });
  },

  // 星级
  setScore(e) {
    const { index, score } = e.currentTarget.dataset;
    this.setData({
      ['goodsReviews[' + index + '].score']: Number(score)
    });
  },
  setShopScore(e) {
    const { key, score } = e.currentTarget.dataset;
    this.setData({ ['shopScores.' + key]: Number(score) });
  },

  // 快捷标签
  toggleTag(e) {
    const { index, tagIndex } = e.currentTarget.dataset;
    const idx = Number(index), ti = Number(tagIndex);
    const item = this.data.goodsReviews[idx];
    const options = item.tagOptions.map((o) => Object.assign({}, o));
    options[ti].checked = !options[ti].checked;
    const tags = options.filter((o) => o.checked).map((o) => o.label);
    this.setData({
      ['goodsReviews[' + idx + '].tagOptions']: options,
      ['goodsReviews[' + idx + '].tags']: tags
    });
  },

  onContent(e) {
    const index = e.currentTarget.dataset.index;
    this.setData({ ['goodsReviews[' + index + '].content']: e.detail.value });
  },
  onShopContent(e) {
    this.setData({ shopContent: e.detail.value });
  },

  // 晒图
  chooseImage(e) {
    const index = e.currentTarget.dataset.index;
    const item = this.data.goodsReviews[index];
    wx.chooseMedia({
      count: 6 - item.images.length,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const paths = res.tempFiles.map((f) => f.tempFilePath);
        this.setData({
          ['goodsReviews[' + index + '].images']: item.images.concat(paths).slice(0, 6)
        });
      }
    });
  },
  previewImage(e) {
    const { index, url } = e.currentTarget.dataset;
    wx.previewImage({ current: url, urls: this.data.goodsReviews[index].images });
  },
  removeImage(e) {
    const { index, imgIndex } = e.currentTarget.dataset;
    const images = this.data.goodsReviews[index].images.slice();
    images.splice(imgIndex, 1);
    this.setData({ ['goodsReviews[' + index + '].images']: images });
  },

  submit() {
    if (this.data.submitting) return;
    if (this.data.goodsReviews.some((g) => g.score === 0)) {
      toast.showToast('请为每件商品打分');
      return;
    }
    this.setData({ submitting: true });
    const payload = {
      goodsReviews: this.data.goodsReviews.map((g) => ({
        goodsId: g.goodsId,
        score: g.score,
        tags: g.tags,
        content: g.content,
        images: g.images
      })),
      shopReview: {
        scores: this.data.shopScores,
        content: this.data.shopContent
      }
    };
    orderApi.review(this.data.id, payload).then((res) => {
      toast.showSuccess('评价成功，积分 +' + res.points);
      setTimeout(() => wx.navigateBack(), 1200);
    }).catch(() => this.setData({ submitting: false }));
  }
});
