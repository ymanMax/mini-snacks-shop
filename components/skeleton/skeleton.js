/**
 * 统一骨架屏组件（灰色色块呼吸动画，纯 CSS）
 * 用法：<skeleton type="goods" /> type: goods(商品双列) | list(单列行) | order(订单卡) | detail(详情页)
 */
Component({
  properties: {
    type: { type: String, value: 'list' },
    rows: { type: Number, value: 4 }
  },
  data: {
    blocks: [0, 1, 2, 3, 4, 5]
  }
});
