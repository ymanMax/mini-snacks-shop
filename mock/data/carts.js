// mock/data/carts.js —— 购物车初始数据（3 条有效 + 1 条失效）
// 由 store 首次启动时结合 goods 数据构建，保证字段与商品实时一致
function buildInitialCart(goodsList) {
  const pick = (id) => goodsList.find((g) => g.id === id);
  const g1 = pick(1); // 薯片
  const g9 = pick(9); // 每日坚果
  const g13 = pick(13); // 奥利奥
  return [
    {
      id: 101,
      goodsId: g1.id,
      name: g1.name,
      pic: g1.pic,
      specText: '标准装 · 原味',
      price: g1.price,
      count: 2,
      checked: true,
      stock: g1.stock,
      invalid: false
    },
    {
      id: 102,
      goodsId: g9.id,
      name: g9.name,
      pic: g9.pic,
      specText: '标准装 · 奶油味',
      price: g9.price,
      count: 1,
      checked: true,
      stock: g9.stock,
      invalid: false
    },
    {
      id: 103,
      goodsId: g13.id,
      name: g13.name,
      pic: g13.pic,
      specText: '分享装 · 原味',
      price: round(g13.price * 1.6),
      count: 1,
      checked: false,
      stock: g13.stock,
      invalid: false
    },
    {
      id: 104,
      goodsId: 0,
      name: '限定海盐味硬糖 200g（已下架）',
      pic: '/static/images/default.png',
      specText: '标准装 · 海盐味',
      price: 9.9,
      count: 1,
      checked: false,
      stock: 0,
      invalid: true
    }
  ];
}

function round(n) {
  return Math.round(n * 100) / 100;
}

module.exports = { buildInitialCart };
