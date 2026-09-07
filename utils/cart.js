// utils/cart.js —— 跨页面加购公共逻辑
const cartApi = require('../api/cart.js')
const toast = require('./toast.js')

// 商品默认规格文本（第一个规格值 + 第一个口味）
function defaultSpecText(goods) {
  const specs = goods.specs || []
  const parts = []
  specs.forEach(function (s) {
    if (s.values && s.values.length) parts.push(s.values[0].label)
  })
  return parts.join(' · ')
}

function defaultPrice(goods) {
  const spec0 = goods.specs && goods.specs[0]
  return spec0 && spec0.values && spec0.values[0] ? spec0.values[0].price : goods.price
}

// 列表页快速加购（默认规格）
function quickAdd(goods, count) {
  if (!goods) return Promise.reject(new Error('商品不存在'))
  if (goods.stock === 0) {
    toast.showToast('该商品暂时缺货')
    return Promise.reject(new Error('stock 0'))
  }
  const n = count || 1
  return cartApi.add({
    goodsId: goods.id,
    count: n,
    specText: defaultSpecText(goods),
    specPrice: defaultPrice(goods),
    pic: goods.pic
  }).then(function () {
    return getApp().refreshCartBadge()
  }).then(function () {
    toast.success('已加入购物车')
  }).catch(function (err) {
    if (err && err.msg) toast.showToast(err.msg)
    throw err
  })
}

module.exports = {
  defaultSpecText: defaultSpecText,
  defaultPrice: defaultPrice,
  quickAdd: quickAdd
}
