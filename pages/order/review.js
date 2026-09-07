// pages/order/review.js —— 订单评价页（优化 7.3 / 模块 2.3）
const api = require('../../api/index.js');
const toast = require('../../utils/toast.js');

const QUICK_TAGS = ['新鲜', '口感好', '包装好', '分量足', '性价比高', '物流快'];
const SHOP_DIMS = [
  { key: 'fresh', label: '新鲜度' },
  { key: 'speed', label: '配送速度' },
  { key: 'package', label: '包装' }
];

Page({
  data: {
    loading: true,
    orderId: 0,
    quickTags: QUICK_TAGS,
    shopDims: SHOP_DIMS,
    goodsReviews: [],   // [{goodsId,name,pic,score,tags,content,images}]
    shopScores: { fresh: 5, speed: 5, package: 5 },
    shopContent: '',
    submitting: false
  },

  onLoad(options) {
    const orderId = Number((options || {}).orderId);
    if (!orderId) {
      toast.showToast('订单参数缺失');
      setTimeout(() => wx.navigateBack({ delta: 1 }), 1500);
      return;
    }
    this.setData({ orderId });
    api.getOrderDetail(orderId).then(o => {
      if (o.isReviewed) {
        toast.showToast('该订单已评价');
        setTimeout(() => wx.navigateBack({ delta: 1 }), 1500);
        return;
      }
      const goodsReviews = (o.items || []).map(it => ({
        goodsId: it.goodsId,
        name: it.name,
        pic: it.pic,
        score: 0,
        tags: [],
        content: '',
        images: []
      }));
      this.setData({ goodsReviews });
    }).catch(() => {}).finally(() => {
      this.setData({ loading: false });
    });
  },

  // ===== 商品评价 =====
  setScore(e) {
    const { gi, score } = e.currentTarget.dataset;
    this.setData({ [`goodsReviews[${gi}].score`]: Number(score) });
  },

  toggleTag(e) {
    const { gi, tag } = e.currentTarget.dataset;
    const tags = this.data.goodsReviews[gi].tags.slice();
    const idx = tags.indexOf(tag);
    if (idx > -1) tags.splice(idx, 1);
    else tags.push(tag);
    this.setData({ [`goodsReviews[${gi}].tags`]: tags });
  },

  onContent(e) {
    const gi = e.currentTarget.dataset.gi;
    this.setData({ [`goodsReviews[${gi}].content`]: e.detail.value });
  },

  chooseImage(e) {
    const gi = Number(e.currentTarget.dataset.gi);
    const images = this.data.goodsReviews[gi].images;
    const remain = 6 - images.length;
    if (remain <= 0) {
      toast.showToast('最多上传 6 张图片');
      return;
    }
    wx.chooseImage({
      count: remain,
      sizeType: ['compressed'],
      success: res => {
        const paths = res.tempFilePaths || [];
        toast.showLoading('上传中...');
        Promise.all(paths.map(p => api.upload(p).catch(() => null)))
          .then(results => {
            const urls = results.filter(r => r && r.url).map(r => r.url);
            if (!urls.length) return;
            this.setData({ [`goodsReviews[${gi}].images`]: this.data.goodsReviews[gi].images.concat(urls) });
          })
          .finally(() => toast.hideLoading());
      }
    });
  },

  delImage(e) {
    const { gi, ii } = e.currentTarget.dataset;
    const images = this.data.goodsReviews[gi].images.slice();
    images.splice(ii, 1);
    this.setData({ [`goodsReviews[${gi}].images`]: images });
  },

  previewImage(e) {
    const { gi, ii } = e.currentTarget.dataset;
    const images = this.data.goodsReviews[gi].images;
    wx.previewImage({ urls: images, current: images[ii] });
  },

  // ===== 店铺评价 =====
  setShopScore(e) {
    const { dim, score } = e.currentTarget.dataset;
    this.setData({ [`shopScores.${dim}`]: Number(score) });
  },

  onShopContent(e) {
    this.setData({ shopContent: e.detail.value });
  },

  // ===== 提交 =====
  submit() {
    if (this.data.submitting) return;
    const { goodsReviews, shopScores, shopContent, orderId } = this.data;
    const unscored = goodsReviews.find(g => !g.score);
    if (unscored) {
      toast.showToast('请为每个商品打分');
      return;
    }
    this.setData({ submitting: true });
    api.submitReview({
      orderId,
      goodsReviews: goodsReviews.map(g => ({
        goodsId: g.goodsId,
        score: g.score,
        tags: g.tags,
        content: g.content,
        images: g.images
      })),
      shopScores,
      shopContent
    }).then(() => {
      toast.success('评价成功，积分 +20');
      setTimeout(() => wx.navigateBack({ delta: 1 }), 1500);
    }).catch(() => {
      this.setData({ submitting: false });
    });
  },

  // ===== 图片兜底 =====
  onImgError(e) {
    const { key, field } = e.currentTarget.dataset;
    if (key !== undefined) {
      this.setData({ [`${field || 'goodsReviews'}[${key}]._imgErr`]: true });
    }
  }
});
