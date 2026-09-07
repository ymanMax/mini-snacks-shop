// mock/delay.js —— 模拟网络延迟（随机 200~600ms）
module.exports = function delay(data) {
  const ms = 200 + Math.floor(Math.random() * 400);
  return new Promise(resolve => setTimeout(() => resolve(data), ms));
};
