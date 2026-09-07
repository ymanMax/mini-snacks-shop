// mock/data/coupons.js —— 优惠券模板与持券记录
// coupon: id, name, type(1满减 2折扣 3无门槛), threshold(满x元,0为无门槛),
//         discount(减y元；折扣券88表示8.8折), scope, status(1未使用 2已使用 3已过期), expireTime, source

function daysLater(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  const p = x => (x < 10 ? '0' + x : '' + x);
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} 23:59`;
}
function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  const p = x => (x < 10 ? '0' + x : '' + x);
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} 23:59`;
}

module.exports = {
  // 领券中心可领取的模板
  templates: [
    { id: 101, name: '满59减8', type: 1, threshold: 59, discount: 8, scope: '全场通用', stock: 500 },
    { id: 102, name: '满99减20', type: 1, threshold: 99, discount: 20, scope: '全场通用', stock: 300 },
    { id: 103, name: '满199减50', type: 1, threshold: 199, discount: 50, scope: '全场通用', stock: 100 },
    { id: 104, name: '5元无门槛券', type: 3, threshold: 0, discount: 5, scope: '全场通用', stock: 200 },
    { id: 105, name: '8.8折零食券', type: 2, threshold: 39, discount: 88, scope: '限休闲零食', stock: 150 },
    { id: 106, name: '礼盒专享满299减80', type: 1, threshold: 299, discount: 80, scope: '限礼盒礼包', stock: 50 }
  ],
  // 我的持券（种子）
  mine: [
    { id: 1, tplId: 101, name: '满59减8', type: 1, threshold: 59, discount: 8, scope: '全场通用', status: 1, expireTime: daysLater(15), source: '领取' },
    { id: 2, tplId: 104, name: '5元无门槛券', type: 3, threshold: 0, discount: 5, scope: '全场通用', status: 1, expireTime: daysLater(7), source: '积分兑换' },
    { id: 3, tplId: 102, name: '满99减20', type: 1, threshold: 99, discount: 20, scope: '全场通用', status: 2, expireTime: daysAgo(2), source: '领取' },
    { id: 4, tplId: 105, name: '8.8折零食券', type: 2, threshold: 39, discount: 88, scope: '限休闲零食', status: 3, expireTime: daysAgo(10), source: '生日赠送' }
  ],
  // 积分兑换专区
  mall: [
    { id: 201, tplId: 104, name: '5元无门槛券', type: 3, threshold: 0, discount: 5, points: 200, scope: '全场通用' },
    { id: 202, tplId: 101, name: '满59减8', type: 1, threshold: 59, discount: 8, points: 300, scope: '全场通用' },
    { id: 203, tplId: 102, name: '满99减20', type: 1, threshold: 99, discount: 20, points: 600, scope: '全场通用' },
    { id: 204, tplId: 105, name: '8.8折零食券', type: 2, threshold: 39, discount: 88, points: 500, scope: '限休闲零食' }
  ]
};
