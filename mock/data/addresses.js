/**
 * 收货地址 Mock 数据（5 条，字段与 4.3 address 对齐）
 * distanceKm 供配送费计算：起步 5 元含 3km，超出 1 元/km，满 59 免基础配送费
 */
const addresses = [
  { id: 1, name: '王小零', phone: '13800008888', province: '广东省', city: '深圳市', district: '南山区', detail: '科技园南区数字大厦 8 栋 1201 室', tag: '公司', isDefault: true, distanceKm: 2.4 },
  { id: 2, name: '王小零', phone: '13800008888', province: '广东省', city: '深圳市', district: '福田区', detail: '梅林街道中康路 12 号 3 栋 502', tag: '家', isDefault: false, distanceKm: 6.8 },
  { id: 3, name: '李大吃', phone: '13900006666', province: '广东省', city: '深圳市', district: '龙岗区', detail: '坂田街道天安云谷 2 期 5 栋 1803', tag: '学校', isDefault: false, distanceKm: 12.5 },
  { id: 4, name: '赵 snack', phone: '13700005555', province: '广东省', city: '东莞市', district: '松山湖', detail: '高新技术产业开发区创新科技园 A 座 301', tag: '公司', isDefault: false, distanceKm: 58.2 },
  { id: 5, name: '陈美美', phone: '13600004444', province: '广东省', city: '广州市', district: '天河区', detail: '珠江新城华夏路 26 号 1508 室', tag: '家', isDefault: false, distanceKm: 120.6 }
];

module.exports = { addresses };
