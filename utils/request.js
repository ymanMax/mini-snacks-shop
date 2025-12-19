const { 
  mockDelay, 
  bannerData, 
  themeData, 
  productsData, 
  productDetailData, 
  categoryData, 
  categoryProductsData, 
  orderData, 
  userOrdersData, 
  paymentData, 
  userVerifyData
} = require('../api/mockData.js')

const app = getApp()
const method = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD', 'TRACE', 'CONNECT'];
const content_type = ['application/json', 'application/x-www-form-urlencoded']

function prompt(e = {}, op, reject, resolve) {
  let title = e.message || '错误 ！';
  if (!title) return;
  let icon = 'success';
  if (e.code !== 0) {
    icon = 'none';
    reject(title, e.data)
  } else if (resolve) resolve(e.data);
  if (op.prompt !== false) wx.showToast({
    title,
    icon,
    duration: 2000
  })
}

module.exports = (url = '', data={}, op = {}, type = 0, content = 0) => {
  if (op.loading !== false) wx.showNavigationBarLoading();
  
  // 使用mock数据替代真实网络请求
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      let mockResponse = {
        code: "success",
        message: "请求成功",
        data: null
      };

      // 根据URL返回不同的mock数据
      if (url.includes('/banner/')) {
        mockResponse.data = bannerData.data;
      } else if (url.includes('/theme/')) {
        const themeId = url.split('/').pop();
        // 根据不同的主题ID返回不同的主题数据
        const themes = {
          1: {
            id: 1,
            name: "热门零食",
            description: "最受欢迎的零食推荐",
            products: [1, 2, 3],
            topic_img: {
              url: "/theme1.jpg"
            }
          },
          2: {
            id: 2,
            name: "新品上市",
            description: "最新上市的零食",
            products: [4, 5],
            topic_img: {
              url: "/theme2.jpg"
            }
          },
          3: {
            id: 3,
            name: "特惠商品",
            description: "性价比高的特惠商品",
            products: [1, 3, 5],
            topic_img: {
              url: "/theme3.jpg"
            }
          }
        };
        mockResponse.data = themes[themeId] || themeData.data;
      } else if (url.includes('/product/recent')) {
        mockResponse.data = productsData.data;
      } else if (url.includes('/product/') && !url.includes('/by_category')) {
        const productId = url.split('/').pop();
        const product = productsData.data.find(item => item.id == productId);
        if (product) {
          mockResponse.data = {
            ...productDetailData.data,
            ...product
          };
        } else {
          mockResponse.code = "error";
          mockResponse.message = "商品不存在";
        }
      } else if (url.includes('/category/all')) {
        mockResponse.data = categoryData.data;
      } else if (url.includes('/product/by_category')) {
        mockResponse.data = categoryProductsData.data;
      } else if (url.includes('/product/search')) {
        // 商品搜索接口
        let filteredProducts = [...productsData.data];

        // 根据关键词筛选
        if (data.keyword) {
          const keyword = data.keyword.toLowerCase();
          filteredProducts = filteredProducts.filter(product =>
            product.name.toLowerCase().includes(keyword) ||
            product.description.toLowerCase().includes(keyword)
          );
        }

        // 根据分类筛选
        if (data.category_id) {
          filteredProducts = filteredProducts.filter(product =>
            product.category_id == data.category_id
          );
        }

        // 根据价格区间筛选
        if (data.min_price !== undefined) {
          filteredProducts = filteredProducts.filter(product =>
            product.price >= data.min_price &&
            (data.max_price ? product.price <= data.max_price : true)
          );
        }

        // 根据排序方式排序
        if (data.sort_by) {
          switch (data.sort_by) {
            case 'price_asc':
              filteredProducts.sort((a, b) => a.price - b.price);
              break;
            case 'price_desc':
              filteredProducts.sort((a, b) => b.price - a.price);
              break;
            case 'sales_desc':
              filteredProducts.sort((a, b) => (b.sales || 0) - (a.sales || 0));
              break;
            // 默认排序
            default:
              // 保持原有顺序
              break;
          }
        }

        mockResponse.data = filteredProducts;
      } else if (url.includes('/order') && type === 1) {
        // 创建订单
        mockResponse.data = orderData.data;
      } else if (url.includes('/order/by_user')) {
        mockResponse.data = userOrdersData.data;
      } else if (url.includes('/order/') && !url.includes('/by_user')) {
        const orderId = url.split('/').pop();
        const order = userOrdersData.data.find(item => item.order_id === orderId);
        if (order) {
          mockResponse.data = order;
        } else {
          mockResponse.code = "error";
          mockResponse.message = "订单不存在";
        }
      } else if (url.includes('/pay/pre_orde')) {
        mockResponse.data = paymentData.data;
      } else if (url.includes('/token/verify')) {
        mockResponse.data = userVerifyData.data;
      } else {
        // 默认返回商品数据
        mockResponse.data = productsData.data;
      }

      console.info(`#api-------返回mock数据-------#:${JSON.stringify(mockResponse)}`)
      
      // 模拟prompt函数处理
      if (mockResponse.code === "success") {
        if (resolve) resolve(mockResponse.data);
      } else {
        reject(mockResponse.message, mockResponse.data);
      }
      
      if (op.loading !== false) wx.hideNavigationBarLoading();
    }, 500); // 模拟网络延迟
  }).catch(()=>{})
}