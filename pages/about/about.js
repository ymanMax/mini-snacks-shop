// pages/about/about.js —— 关于我们（静态页）
Page({
  data: {
    imgErr: false
  },
  onImgError() {
    this.setData({ imgErr: true });
  }
});
