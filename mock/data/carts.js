/**
 * 购物车初始 Mock 数据（3~4 条，字段与 4.2 cartItem 对齐）
 * checked=是否选中结算，invalid=失效商品（库存为 0 / 下架）
 */
const carts = [
  { id: 1, goodsId: 1, name: '经典原味薯片 酥脆追剧零食', pic: '/static/mock/goods-1.png', specText: '3袋实惠装 · 原味', price: 19.67, count: 2, checked: true, stock: 106, invalid: false },
  { id: 2, goodsId: 10, name: '每日坚果混合装 30包', pic: '/static/mock/goods-10.png', specText: '1盒装', price: 59.9, count: 1, checked: true, stock: 400, invalid: false },
  { id: 3, goodsId: 19, name: '靖江猪肉脯 原味蜜汁', pic: '/static/mock/goods-1.png', specText: '1袋尝鲜装 · 蜜汁味', price: 18.9, count: 3, checked: false, stock: 350, invalid: false },
  { id: 4, goodsId: 26, name: '冰红茶 柠檬味', pic: '/static/mock/goods-8.png', specText: '12瓶装', price: 6.72, count: 1, checked: false, stock: 0, invalid: true }
];

module.exports = { carts };
