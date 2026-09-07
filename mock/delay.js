// mock/delay.js —— 模拟真实网络延迟（200~600ms 随机）
function randomDelay(min = 200, max = 600) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function delay(data, ms) {
  const wait = ms === undefined ? randomDelay() : ms;
  return new Promise((resolve) => {
    setTimeout(() => resolve(data), wait);
  });
}

module.exports = {
  delay,
  randomDelay
};
