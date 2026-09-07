// mock/data/carts.js —— 购物车初始数据（3 条有效 + 1 条失效）
const { G } = require('./goods.js')

const carts = [
  {
    id: 1001,
    goodsId: 1,
    name: '香辣味薯片',
    pic: G(1),
    specText: '分享装x2 · 香辣味',
    price: 13.11,
    count: 2,
    checked: true,
    stock: 200,
    invalid: false
  },
  {
    id: 1002,
    goodsId: 9,
    name: '奶油夏威夷果',
    pic: G(9),
    specText: '尝鲜装x1 · 奶油味',
    price: 29.9,
    count: 1,
    checked: true,
    stock: 120,
    invalid: false
  },
  {
    id: 1003,
    goodsId: 21,
    name: '手摇珍珠奶茶',
    pic: G(21),
    specText: '尝鲜装x1 · 原味',
    price: 8.8,
    count: 3,
    checked: false,
    stock: 240,
    invalid: false
  },
  {
    id: 1004,
    goodsId: 8,
    name: '海盐薄荷糖',
    pic: G(8),
    specText: '尝鲜装x1 · 原味',
    price: 3.9,
    count: 1,
    checked: false,
    stock: 0,
    invalid: true
  }
]

module.exports = carts
