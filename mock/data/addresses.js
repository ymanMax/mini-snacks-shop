// mock/data/addresses.js —— 收货地址（distanceKm 供配送费计算）
const addresses = [
  {
    id: 1,
    name: '张无忌',
    phone: '138****8888',
    province: '浙江省',
    city: '杭州市',
    district: '西湖区',
    detail: '文三路 138 号东方通信大厦 12 幢 601 室',
    tag: '家',
    isDefault: true,
    distanceKm: 2.5
  },
  {
    id: 2,
    name: '张无忌',
    phone: '138****8888',
    province: '浙江省',
    city: '杭州市',
    district: '滨江区',
    detail: '网商路 599 号阿里巴巴 B 座 8 层',
    tag: '公司',
    isDefault: false,
    distanceKm: 7.8
  },
  {
    id: 3,
    name: '李沧海',
    phone: '139****6666',
    province: '浙江省',
    city: '杭州市',
    district: '余杭区',
    detail: '文一西路 969 号未来科技城 A 区 3 栋',
    tag: '学校',
    isDefault: false,
    distanceKm: 12.6
  },
  {
    id: 4,
    name: '王语嫣',
    phone: '137****1234',
    province: '浙江省',
    city: '杭州市',
    district: '上城区',
    detail: '湖滨银泰 in77 B 区一层服务台旁',
    tag: '',
    isDefault: false,
    distanceKm: 0.8
  }
]

module.exports = addresses
