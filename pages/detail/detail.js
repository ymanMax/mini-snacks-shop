// pages/detail/detail.js —— 商品详情：多图/视频、SKU、评价、收藏、推荐、足迹、分享
const app = getApp();
const { goodsApi, cartApi, reviewApi, collectApi, footprintApi, shopApi, couponApi, groupApi } = require('../../api/index.js');
const toast = require('../../utils/toast.js');

Page({
  data: {
    id: null,
    goods: null,
    loading: true,
    mediaTab: 'image', // image | video
    hasVideo: true,
    swiperIndex: 1,
    recommend: [],
    // 评价
    reviewSummary: null,
    reviews: [],
    previewReviews: [],
    reviewExpanded: false,
    reviewLoadStatus: 'hidden',
    reviewPage: 1,
    // SKU 弹层
    skuVisible: false,
    skuMode: 'cart', // cart | buy
    selected: {}, // { 规格: value, 口味: label }
    selectedLabels: [],
    selectedText: '',
    curPrice: 0,
    curStock: 0,
    curPic: '',
    count: 1,
    // 底部栏
    isCollect: false,
    cartCount: 0,
    shop: null,
    claimableCount: 0
  },

  onLoad(options) {
    const id = Number(options.product_id || options.id);
    this.setData({ id });
    this.loadDetail(id);
    footprintApi.add(id).catch(() => {});
    shopApi.getInfo().then((shop) => this.setData({ shop })).catch(() => {});
    couponApi.getTemplates().then((list) => {
      this.setData({ claimableCount: list.filter((c) => !c.received).length });
    }).catch(() => {});
  },

  goCouponCenter() {
    wx.navigateTo({ url: '/pages/coupon/center/center' });
  },

  onShow() {
    app.updateCartBadge();
    this.setData({ cartCount: app.globalData.cartCount || 0 });
    this._onCart = (p) => this.setData({ cartCount: p.count });
    app.on('cartChange', this._onCart);
  },

  onUnload() {
    app.off('cartChange', this._onCart);
  },

  loadDetail(id) {
    goodsApi.getDetail(id).then((g) => {
      // SKU 默认选中项（仅用于展示价格联动，不默认选中）
      this.setData({
        goods: g,
        loading: false,
        isCollect: g.isCollect,
        hasVideo: !!g.videoUrl,
        curPrice: g.price,
        curStock: g.stock,
        curPic: g.pic,
        swiperIndex: 1
      });
      wx.setNavigationBarTitle({ title: g.name });
    }).catch(() => this.setData({ loading: false }));

    goodsApi.getRecommend(id).then((list) => this.setData({ recommend: list })).catch(() => {});

    this.loadReviews(true);
  },

  loadReviews(reset) {
    const page = reset ? 1 : this.data.reviewPage;
    this.setData({ reviewLoadStatus: 'loading' });
    reviewApi.getGoodsReviews(this.data.id, { current: page, size: 10 }).then((res) => {
      const list = reset ? res.records : this.data.reviews.concat(res.records);
      this.setData({
        reviews: list,
        previewReviews: list.slice(0, 2),
        reviewSummary: res.summary,
        reviewPage: page + 1,
        reviewLoadStatus: list.length >= res.total ? 'nomore' : 'hidden'
      });
    }).catch(() => this.setData({ reviewLoadStatus: 'hidden' }));
  },

  // ---- 媒体区 ----
  onSwiperChange(e) {
    this.setData({ swiperIndex: e.detail.current + 1 });
  },
  switchMedia(e) {
    const tab = e.currentTarget.dataset.tab;
    if (tab === 'video' && !this.data.hasVideo) {
      toast.showToast('视频加载失败，仅展示图片');
      return;
    }
    this.setData({ mediaTab: tab });
  },
  onVideoError() {
    this.setData({ hasVideo: false, mediaTab: 'image' });
  },
  previewImage(e) {
    const url = e.currentTarget.dataset.url;
    wx.previewImage({
      current: url,
      urls: this.data.goods.pics
    });
  },
  previewReviewImage(e) {
    const { urls, url } = e.currentTarget.dataset;
    wx.previewImage({ current: url, urls });
  },

  // ---- 收藏 ----
  toggleCollect() {
    collectApi.toggle(this.data.id).then((res) => {
      this.setData({ isCollect: res.isCollect });
      toast.showToast(res.isCollect ? '已收藏' : '已取消收藏', 'success');
    }).catch(() => {});
  },

  // ---- SKU 弹层 ----
  openSku(e) {
    const mode = e.currentTarget.dataset.mode || 'cart';
    this.setData({ skuVisible: true, skuMode: mode, count: 1 });
  },
  closeSku() {
    this.setData({ skuVisible: false });
  },
  noop() {},
  pickSpec(e) {
    const { dim, label, price, stock, pic } = e.currentTarget.dataset;
    const selected = Object.assign({}, this.data.selected);
    if (selected[dim] && selected[dim].label === label) {
      delete selected[dim];
    } else {
      selected[dim] = { label, price: price !== undefined ? Number(price) : undefined,
        stock: stock !== undefined ? Number(stock) : undefined, pic };
    }
    this.applySelected(selected);
  },
  applySelected(selected) {
    const g = this.data.goods;
    const pack = selected['规格'];
    const curPrice = pack && pack.price !== undefined ? pack.price : g.price;
    const curStock = pack && pack.stock !== undefined ? pack.stock : g.stock;
    const curPic = pack && pack.pic ? pack.pic : g.pic;
    const labels = g.specs.map((s) => selected[s.name] ? selected[s.name].label : '').filter(Boolean);
    this.setData({
      selected,
      selectedLabels: labels,
      selectedText: labels.join(' · '),
      curPrice,
      curStock,
      curPic,
      count: Math.min(this.data.count, curStock || 1)
    });
  },
  isSpecComplete() {
    const g = this.data.goods;
    return g.specs.every((s) => this.data.selected[s.name]);
  },
  minusCount() {
    if (this.data.count > 1) this.setData({ count: this.data.count - 1 });
  },
  plusCount() {
    if (this.data.count < this.data.curStock) {
      this.setData({ count: this.data.count + 1 });
    } else {
      toast.showToast('已达库存上限');
    }
  },
  // 确认 SKU
  confirmSku() {
    if (!this.isSpecComplete()) {
      toast.showToast('请选择完整规格');
      return;
    }
    const specText = this.data.selectedText;
    const payload = {
      goodsId: this.data.goods.id,
      count: this.data.count,
      specText,
      price: this.data.curPrice
    };
    if (this.data.skuMode === 'cart') {
      cartApi.add(payload).then(() => {
        this.setData({ skuVisible: false });
        toast.showSuccess('已加入购物车');
        app.updateCartBadge();
      }).catch(() => {});
    } else {
      // 立即购买：携带快照到订单确认页
      const g = this.data.goods;
      app.globalData.buyNow = [{
        goodsId: g.id,
        name: g.name,
        pic: this.data.curPic,
        specText,
        price: this.data.curPrice,
        count: this.data.count
      }];
      this.setData({ skuVisible: false });
      wx.navigateTo({ url: '/pages/order/confirm/confirm?from=buy' });
    }
  },

  // 评价展开/收起
  toggleReviews() {
    const next = !this.data.reviewExpanded;
    this.setData({ reviewExpanded: next });
    if (next && this.data.reviews.length < (this.data.reviewSummary ? this.data.reviewSummary.total : 0)) {
      this.loadReviews(false);
    }
  },
  loadMoreReviews() {
    if (this.data.reviewLoadStatus !== 'loading') this.loadReviews(false);
  },

  goShop() {
    wx.navigateTo({ url: '/pages/shop/index/index' });
  },
  goCart() {
    wx.switchTab({ url: '/pages/cart/cart' });
  },

  onShareAppMessage() {
    const g = this.data.goods || {};
    // 分享裂变：分享商品得积分（每日上限 3 次）
    groupApi.shareReward('goods').then((res) => {
      if (res.awarded) toast.showToast('分享成功，积分 +' + res.points);
    }).catch(() => {});
    return {
      title: `${g.name || '零食商城'} 仅¥${g.price}，新鲜好货速来抢购～`,
      imageUrl: g.pic,
      path: `/pages/detail/detail?product_id=${this.data.id}`
    };
  },

  onShareTimeline() {
    const g = this.data.goods || {};
    return { title: `${g.name} 仅¥${g.price}`, query: 'product_id=' + this.data.id, imageUrl: g.pic };
  }
});
