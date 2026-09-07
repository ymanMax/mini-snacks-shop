/**
 * 统一商品卡片组件（列表页 / 首页 / 分类页 / 搜索结果 / 收藏 / 猜你喜欢 共用）
 *
 * 用法：
 *   <goods-card goods="{{item}}" mode="grid" bind:added="onCartChanged" />
 *   mode: grid(双列瀑布卡片) | row(单列横向卡片) | mini(横滑小卡)
 * 事件：
 *   bind:added  加购成功后触发（detail: {goods}），页面可借此刷新角标
 * 行为：
 *   - 点击卡片跳转 /pages/detail/detail?id=xx
 *   - 加购按钮：默认规格一键加购（api.cart.add）+ 全局角标刷新 + toast
 *   - 图片 binderror 回退 /static/images/default.png
 */
const api = require('../../api/index.js');
const toast = require('../../utils/toast.js');

Component({
  properties: {
    goods: { type: Object, value: {} },
    mode: { type: String, value: 'grid' }, // grid | row | mini
    showAdd: { type: Boolean, value: true }
  },
  data: {
    imgSrc: '',
    DEFAULT_IMG: '/static/images/default.png'
  },
  observers: {
    'goods.pic': function (pic) {
      this.setData({ imgSrc: pic || this.data.DEFAULT_IMG });
    }
  },
  lifetimes: {
    attached() {
      this.setData({ imgSrc: this.data.goods.pic || this.data.DEFAULT_IMG });
    }
  },
  methods: {
    onImgError() {
      this.setData({ imgSrc: this.data.DEFAULT_IMG });
    },
    onTapCard() {
      const g = this.data.goods;
      if (!g || !g.id) return;
      wx.navigateTo({ url: '/pages/detail/detail?id=' + g.id });
    },
    onAddCart(e) {
      const g = this.data.goods;
      if (!g || !g.id) return;
      if (g.stock <= 0) {
        toast.showError('商品已售罄');
        return;
      }
      const spec0 = (g.specs && g.specs[0] && g.specs[0].values && g.specs[0].values[0]) || {};
      api.cart.add({
        goodsId: g.id,
        name: g.name,
        pic: g.pic,
        specText: spec0.label || '默认',
        price: spec0.price !== undefined ? spec0.price : g.minPrice,
        count: 1,
        stock: spec0.stock !== undefined ? spec0.stock : g.stock
      }).then(() => {
        toast.showSuccess('已加入购物车');
        const app = getApp();
        if (app && app.refreshCartBadge) app.refreshCartBadge();
        this.triggerEvent('added', { goods: g });
      }).catch(() => {});
    }
  }
});
