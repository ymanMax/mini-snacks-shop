// pages/detail/detail.js —— 商品详情页（优化 5：SKU / 视频 / 评价 / 收藏 / 看了又看；优化 1：领券条 / 拼团入口）
const api = require('../../api/index.js');
const toast = require('../../utils/toast.js');
const { mul, add, priceText } = require('../../utils/format.js');

// 星级字符渲染（半星以 ★/☆ 近似）
function starText(score) {
  let full = Math.round(Number(score) || 0);
  if (full < 0) full = 0;
  if (full > 5) full = 5;
  let s = '';
  for (let i = 0; i < 5; i++) s += i < full ? '★' : '☆';
  return s;
}

// 券面文案：type 1满减 2折扣 3无门槛（与领券中心一致）
function decorateCoupon(c) {
  const type = Number(c.type);
  let left = '';
  let sub = '';
  if (type === 2) {
    left = (Number(c.discount) / 10).toFixed(1) + '折';
    sub = c.threshold > 0 ? '满' + c.threshold + '可用' : '无门槛';
  } else {
    left = '¥' + c.discount;
    sub = type === 3 || Number(c.threshold) === 0 ? '无门槛' : '满' + c.threshold + '可用';
  }
  return Object.assign({}, c, { leftText: left, leftSmall: type === 2, subText: sub });
}

Page({
  data: {
    id: 0,
    loading: true,          // 首屏骨架屏
    goods: null,
    pics: [],               // [{url, _imgErr}]
    detailImages: [],       // [{url, _imgErr}]
    // 媒体区
    mediaTab: 'image',      // image | video
    swiperCurrent: 0,
    showVideoTab: false,
    videoErr: false,
    // SKU 弹层
    skuShow: false,
    skuMode: 'cart',        // cart | buy
    selected: [],           // 各维度选中下标，-1 未选
    skuAllSelected: false,
    specText: '',
    curPrice: 0,
    curStock: 0,
    skuPic: '',
    skuImgErr: false,
    count: 1,
    // 购物车角标
    cartCount: 0,
    // 评价
    reviews: [],
    reviewSummary: null,
    summaryStars: '',
    reviewCurrent: 1,
    reviewSize: 3,
    reviewHasMore: false,
    reviewExpanded: false,
    // 看了又看
    recommend: [],
    // 优惠券条（优化 1）
    couponList: [],       // 领券中心全部模板（装饰后）
    couponBrief: [],      // 前 3 张未领取券
    couponCount: 0,       // 可领取总数
    couponShow: false,    // 半屏券列表弹层
    // 拼团入口（优化 1）
    group: null,          // 该商品进行中的团
    groupSaving: '0.00'   // 发起拼团立省金额
  },

  onLoad(options) {
    const id = Number(options.id) || 0;
    this.setData({ id });
    // 订阅购物车角标
    this.unsubCart = getApp().onCartCountChange(count => this.setData({ cartCount: count }));
    this.loadDetail(true);
    this.loadRecommend();
    this.loadReviews(false);
    this.loadCoupons();
    this.loadGroup();
  },

  onShow() {
    // 角标刷新
    getApp().refreshCartBadge();
    // 已加载过时静默重查详情（同步收藏状态等）
    if (this.data.goods) this.loadDetail(false);
  },

  onUnload() {
    if (this.unsubCart) this.unsubCart();
  },

  // ===== 数据加载 =====
  loadDetail(first) {
    return api.getGoodsDetail(this.data.id).then(g => {
      const pics = (g.pics && g.pics.length ? g.pics : [g.pic]).map(u => ({ url: u, _imgErr: false }));
      const detailImages = (g.detailImages || []).map(u => ({ url: u, _imgErr: false }));
      this.setData({
        goods: g,
        pics,
        detailImages,
        loading: false,
        showVideoTab: !!g.videoUrl && !this.data.videoErr,
        // 发起拼团立省金额 = minPrice - minPrice*0.8
        groupSaving: priceText(add(g.minPrice, -mul(g.minPrice, 0.8)))
      }, () => this.updateSkuDerived());
    }).catch(() => {
      if (first) this.setData({ loading: false });
    });
  },

  loadRecommend() {
    api.getRecommend(this.data.id, 6).then(list => {
      this.setData({ recommend: list || [] });
    }).catch(() => {});
  },

  decorateReview(r) {
    return Object.assign({}, r, {
      stars: starText(r.score),
      imageUrls: r.images || [],
      images: (r.images || []).map(u => ({ url: u, _imgErr: false }))
    });
  },

  loadReviews(append) {
    const current = append ? this.data.reviewCurrent + 1 : 1;
    api.getGoodsReviews({ goodsId: this.data.id, current, size: this.data.reviewSize }).then(res => {
      const list = (res.records || []).map(r => this.decorateReview(r));
      const reviews = append ? this.data.reviews.concat(list) : list;
      this.setData({
        reviews,
        reviewSummary: res.summary || null,
        summaryStars: starText(res.summary ? res.summary.avg : 5),
        reviewCurrent: current,
        reviewHasMore: reviews.length < (res.total || 0)
      });
    }).catch(() => {});
  },

  // ===== 优惠券条（优化 1）=====
  loadCoupons() {
    api.getCouponCenter().then(list => {
      const couponList = (list || []).map(decorateCoupon);
      const unclaimed = couponList.filter(c => !c.claimed);
      this.setData({
        couponList,
        couponBrief: unclaimed.slice(0, 3),
        couponCount: unclaimed.length
      });
    }).catch(() => {});
  },

  openCoupons() {
    this.setData({ couponShow: true });
  },

  closeCoupons() {
    this.setData({ couponShow: false });
  },

  onClaimCoupon(e) {
    const index = Number(e.currentTarget.dataset.index);
    const item = this.data.couponList[index];
    if (!item || item.claimed) return;
    api.claimCoupon(item.id).then(() => {
      toast.success('领取成功');
      const couponList = this.data.couponList.map((c, i) =>
        i === index ? Object.assign({}, c, { claimed: true }) : c);
      const unclaimed = couponList.filter(c => !c.claimed);
      this.setData({
        couponList,
        couponBrief: unclaimed.slice(0, 3),
        couponCount: unclaimed.length
      });
    }).catch(() => {});
  },

  // ===== 拼团入口（优化 1）=====
  loadGroup() {
    api.getGroupByGoods(this.data.id).then(group => {
      this.setData({ group: group || null });
    }).catch(() => {});
  },

  goGroup() {
    if (!this.data.group) return;
    wx.navigateTo({ url: '/pages/group/detail?id=' + this.data.group.id });
  },

  // ===== 媒体区 =====
  switchMedia(e) {
    this.setData({ mediaTab: e.currentTarget.dataset.tab });
  },

  onSwiperChange(e) {
    this.setData({ swiperCurrent: e.detail.current });
  },

  onVideoError() {
    // 视频加载失败：隐藏视频 Tab 并切回图片
    this.setData({ videoErr: true, showVideoTab: false, mediaTab: 'image' });
  },

  previewImage(e) {
    const index = Number(e.currentTarget.dataset.index) || 0;
    const urls = this.data.pics.map(p => p.url);
    wx.previewImage({ urls, current: urls[index] });
  },

  previewReviewImage(e) {
    const { urls, current } = e.currentTarget.dataset;
    if (!urls || !urls.length) return;
    wx.previewImage({ urls, current });
  },

  // ===== SKU =====
  openSku(e) {
    const mode = (e && e.currentTarget.dataset.mode) || 'cart';
    this.setData({ skuShow: true, skuMode: mode });
  },

  closeSku() {
    this.setData({ skuShow: false });
  },

  selectSpec(e) {
    const { dim, index } = e.currentTarget.dataset;
    const goods = this.data.goods;
    if (!goods) return;
    const val = goods.specs[dim].values[index];
    if (dim === 0 && val.stock === 0) {
      toast.showToast('该规格暂时缺货');
      return;
    }
    const selected = this.data.selected.slice();
    selected[dim] = index;
    this.setData({ selected, count: 1 }, () => this.updateSkuDerived());
  },

  // 根据选中规格联动价格 / 库存 / 小图 / 已选文案
  updateSkuDerived() {
    const { goods, selected } = this.data;
    if (!goods) return;
    let price = goods.minPrice;
    let stock = goods.stock;
    let pic = goods.pic;
    let all = true;
    const parts = [];
    (goods.specs || []).forEach((dim, di) => {
      const si = selected[di];
      if (si === undefined || si === null || si < 0) { all = false; return; }
      const v = dim.values[si];
      parts.push(v.label);
      if (di === 0) {
        if (v.price != null) price = v.price;
        if (v.stock != null) stock = v.stock;
        if (v.pic) pic = v.pic;
      }
    });
    let count = this.data.count;
    if (count > stock) count = stock > 0 ? stock : 1;
    if (count < 1) count = 1;
    this.setData({
      curPrice: price,
      curStock: stock,
      skuPic: pic,
      skuImgErr: false,
      specText: all ? parts.join(' · ') : '',
      skuAllSelected: all,
      count
    });
  },

  minusCount() {
    if (this.data.count <= 1) return;
    this.setData({ count: this.data.count - 1 });
  },

  plusCount() {
    if (this.data.count >= this.data.curStock) {
      toast.showToast('已达库存上限');
      return;
    }
    this.setData({ count: this.data.count + 1 });
  },

  confirmSku() {
    if (!this.data.skuAllSelected) {
      toast.showToast('请选择规格');
      return;
    }
    const { skuMode, id, specText, curPrice, count, skuPic, curStock } = this.data;
    if (skuMode === 'buy') {
      this.closeSku();
      wx.navigateTo({
        url: '/pages/order/confirm?mode=buynow&goodsId=' + id +
          '&specText=' + encodeURIComponent(specText) +
          '&price=' + curPrice + '&count=' + count
      });
      return;
    }
    if (skuMode === 'group') {
      // 发起拼团：开团 → 同款 Mock 支付 → 跳拼团详情
      this.closeSku();
      api.startGroup({ goodsId: id, specText, count }).then(res => {
        toast.showLoading('支付中...');
        setTimeout(() => {
          api.payOrder(res.order.id).then(() => {
            toast.hideLoading();
            toast.success('支付成功，拼团已发起');
            setTimeout(() => {
              wx.redirectTo({ url: '/pages/group/detail?id=' + res.group.id });
            }, 800);
          }).catch(() => toast.hideLoading());
        }, 2000);
      }).catch(() => {});
      return;
    }
    api.addToCart({ goodsId: id, specText, price: curPrice, count, pic: skuPic, stock: curStock }).then(() => {
      this.closeSku();
      toast.success('已加入购物车');
      getApp().refreshCartBadge();
    }).catch(() => {});
  },

  // ===== 收藏 / 购物车 / 跳转 =====
  toggleCollect() {
    api.toggleCollect(this.data.id).then(res => {
      this.setData({ 'goods.isCollect': res.isCollect });
      toast.showToast(res.isCollect ? '已收藏' : '已取消收藏');
    }).catch(() => {});
  },

  goCart() {
    wx.switchTab({ url: '/pages/cart/cart' });
  },

  goDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: '/pages/detail/detail?id=' + id });
  },

  // ===== 评价 =====
  expandReviews() {
    this.setData({ reviewExpanded: true });
    if (this.data.reviewHasMore) this.loadReviews(true);
  },

  loadMoreReviews() {
    if (this.data.reviewHasMore) this.loadReviews(true);
  },

  // ===== 图片兜底（契约 §5）=====
  onImgError(e) {
    const { key, field } = e.currentTarget.dataset;
    if (key !== undefined) {
      this.setData({ [`${field || 'list'}[${key}]._imgErr`]: true });
    } else {
      this.setData({ [field || 'imgErr']: true });
    }
  },

  // ===== 分享 =====
  onShareAppMessage() {
    const g = this.data.goods;
    if (!g) return { title: '零食商城', path: '/pages/index/index' };
    // 分享得积分（每日限 3 次，失败静默）
    api.shareReward('goods').then(() => toast.showToast('+5 积分')).catch(() => {});
    const uid = getApp().globalData.userInfo.id;
    return {
      title: g.name + ' ￥' + g.minPrice,
      path: '/pages/detail/detail?id=' + this.data.id + '&inviteBy=' + uid,
      imageUrl: g.pic
    };
  }
});
