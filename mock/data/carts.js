// mock/data/carts.js —— 购物车初始数据（3~4 条）
// cartItem: id, goodsId, name, pic, specText, price, count, checked, stock, invalid
module.exports = [
  { id: 1, goodsId: 1, name: '原切香脆薯片', pic: '/static/mock/goods1.png', specText: '70g*3袋 · 原味', price: 15.9, count: 2, checked: true, stock: 200, invalid: false },
  { id: 2, goodsId: 9, name: '每日坚果混合装', pic: '/static/mock/goods7.png', specText: '25g*30包 整箱 · 经典混合', price: 99.0, count: 1, checked: true, stock: 90, invalid: false },
  { id: 3, goodsId: 17, name: '蜜汁猪肉脯', pic: '/static/mock/goods15.png', specText: '200g*1袋 · 蜜汁味', price: 28.9, count: 1, checked: false, stock: 190, invalid: false },
  { id: 4, goodsId: 5, name: '黑巧克力礼盒装', pic: '/static/mock/goods4.png', specText: '120g 礼盒 · 72%黑巧', price: 39.9, count: 1, checked: false, stock: 0, invalid: true }
];
