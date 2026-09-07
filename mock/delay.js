// mock/delay.js —— 模拟网络延迟
function randomDelay(min, max) {
  min = min == null ? 200 : min
  max = max == null ? 600 : max
  return Math.floor(min + Math.random() * (max - min))
}

function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms == null ? randomDelay() : ms)
  })
}

module.exports = {
  delay,
  randomDelay
}
