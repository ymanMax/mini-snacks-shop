// pages/address/map/map.js —— mock 地图选点/定位（纯前端模拟，无地图 SDK）
const app = getApp();

const POIS = [
  { id: 1, name: '博云路 2 号 A 座', detail: '博云路 2 号 A 座 12 层', region: ['上海市', '上海市', '浦东新区'], distanceKm: 2.5 },
  { id: 2, name: '张江地铁站', detail: '祖冲之路 660 号科苑大楼', region: ['上海市', '上海市', '浦东新区'], distanceKm: 3.8 },
  { id: 3, name: '人民广场来福士', detail: '西藏中路 268 号来福士广场', region: ['上海市', '上海市', '黄浦区'], distanceKm: 9.6 },
  { id: 4, name: '徐家汇美罗城', detail: '肇嘉浜路 1111 号美罗城', region: ['上海市', '上海市', '徐汇区'], distanceKm: 12.4 },
  { id: 5, name: '五角场万达广场', detail: '国宾路 58 号万达广场 B 座', region: ['上海市', '上海市', '杨浦区'], distanceKm: 15.6 },
  { id: 6, name: '虹桥天地', detail: '申长路 688 号虹桥天地 3 号楼', region: ['上海市', '上海市', '闵行区'], distanceKm: 18.2 },
  { id: 7, name: '崇明新城公园', detail: '崇明大道 801 号', region: ['上海市', '上海市', '崇明区'], distanceKm: 25 }
];

Page({
  data: {
    pois: POIS,
    selected: null,
    locating: false
  },

  pickPoi(e) {
    const id = Number(e.currentTarget.dataset.id);
    const poi = POIS.find((x) => x.id === id);
    this.setData({ selected: poi });
  },

  // mock 定位：随机选取附近 POI
  locate() {
    this.setData({ locating: true });
    setTimeout(() => {
      const near = POIS.filter((p) => p.distanceKm <= 10);
      const poi = near[Math.floor(Math.random() * near.length)];
      this.setData({ selected: poi, locating: false });
      wx.showToast({ title: '定位成功', icon: 'success', duration: 1000 });
    }, 800);
  },

  confirm() {
    const poi = this.data.selected;
    if (!poi) {
      wx.showToast({ title: '请先在地图上选择位置', icon: 'none' });
      return;
    }
    if (poi.distanceKm > 20) {
      wx.showModal({
        title: '超出配送范围',
        content: `该位置距店铺 ${poi.distanceKm}km，暂不支持配送，仍要保存该地址吗？`,
        confirmColor: '#b4282d',
        success: (res) => { if (res.confirm) this.backWithPoi(poi); }
      });
      return;
    }
    this.backWithPoi(poi);
  },

  backWithPoi(poi) {
    app.globalData.mapPickedAddress = {
      region: poi.region,
      detail: poi.detail,
      distanceKm: poi.distanceKm,
      poiName: poi.name
    };
    wx.navigateBack();
  }
});
