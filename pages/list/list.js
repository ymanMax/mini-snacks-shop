// pages/list/list.js —— 主题商品列表页（承接首页精选主题 / banner 跳转）
const api = require('../../api/index.js');
const toast = require('../../utils/toast.js');

Page({
  data: {
    theme: null, // { id, name, description, img, goodsIds }
    themeImgErr: false,
    list: [],
    current: 1,
    size: 10,
    total: 0,
    loading: false,
    noMore: false,
    loaded: false // 主题信息是否已加载（用于空态判断）
  },

  onLoad(options) {
    const themeId = Number(options.theme) || 0;
    api.getThemes()
      .then(themes => {
        const theme = (themes || []).find(t => t.id === themeId) || (themes || [])[0] || null;
        this.setData({ theme, loaded: true });
        if (!theme) return;
        wx.setNavigationBarTitle({ title: theme.name });
        this.loadGoods(1);
      })
      .catch(() => this.setData({ loaded: true }));
  },

  onReachBottom() {
    if (this.data.loading || this.data.noMore || !this.data.theme) return;
    this.loadGoods(this.data.current + 1);
  },

  loadGoods(page) {
    const theme = this.data.theme;
    if (this.data.loading || !theme || !theme.goodsIds || !theme.goodsIds.length) return Promise.resolve();
    this.setData({ loading: true });
    // mock 返回按 ids 顺序排列
    return api.getGoodsList({ ids: theme.goodsIds.join(','), current: page, size: this.data.size })
      .then(res => {
        const records = res.records || [];
        // 按主题 goodsIds 顺序重排当前页（mock 默认 hotScore 排序会覆盖 ids 顺序）
        const order = {};
        theme.goodsIds.forEach((id, i) => { order[id] = i; });
        records.sort((a, b) => (order[a.id] != null ? order[a.id] : 999) - (order[b.id] != null ? order[b.id] : 999));
        const list = page === 1 ? records : this.data.list.concat(records);
        this.setData({
          list,
          current: page,
          total: res.total || 0,
          noMore: records.length < this.data.size || list.length >= (res.total || 0)
        });
      })
      .catch(() => {})
      .finally(() => this.setData({ loading: false }));
  },

  goDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: '/pages/detail/detail?id=' + id });
  },

  onAddCart(e) {
    const item = e.currentTarget.dataset.item;
    if (!item) return;
    const spec0 = item.specs && item.specs[0] && item.specs[0].values[0];
    const spec1 = item.specs && item.specs[1] && item.specs[1].values[0];
    const specText = (spec0 ? spec0.label : '默认规格') + (spec1 ? ' · ' + spec1.label : '');
    const price = spec0 && spec0.price != null ? spec0.price : item.minPrice;
    api.addToCart({ goodsId: item.id, specText, price, count: 1 })
      .then(() => {
        toast.success('已加入购物车');
        getApp().refreshCartBadge();
      })
      .catch(() => {});
  },

  // ---------- 图片兜底（契约 §5） ----------
  onImgError(e) {
    const { key, field } = e.currentTarget.dataset;
    if (key !== undefined) {
      this.setData({ [`${field || 'list'}[${key}]._imgErr`]: true });
    } else {
      this.setData({ [field || 'imgErr']: true });
    }
  }
});
