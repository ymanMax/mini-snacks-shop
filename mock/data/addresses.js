// mock/data/addresses.js —— 4~5 条收货地址
const addresses = [
  {
    id: 1,
    name: '张小馋',
    phone: '138****8888',
    province: '上海市',
    city: '上海市',
    district: '浦东新区',
    detail: '张江高科技园区博云路 2 号 A 座 12 层',
    tag: '公司',
    isDefault: true,
    distanceKm: 2.5
  },
  {
    id: 2,
    name: '张小馋',
    phone: '138****8888',
    province: '上海市',
    city: '上海市',
    district: '徐汇区',
    detail: '漕溪北路 100 号玉兰花园 3 栋 1802 室',
    tag: '家',
    isDefault: false,
    distanceKm: 8.2
  },
  {
    id: 3,
    name: '李同学',
    phone: '139****6666',
    province: '上海市',
    city: '上海市',
    district: '杨浦区',
    detail: '国定路 335 号复旦大学北区学生公寓 12 号楼',
    tag: '学校',
    isDefault: false,
    distanceKm: 15.6
  },
  {
    id: 4,
    name: '王女士',
    phone: '137****1234',
    province: '上海市',
    city: '上海市',
    district: '静安区',
    detail: '南京西路 1266 号恒隆广场写字楼 46 层',
    tag: '公司',
    isDefault: false,
    distanceKm: 11
  }
];

module.exports = addresses;
