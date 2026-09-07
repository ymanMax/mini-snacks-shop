/**
 * 模拟网络延迟：随机 200~600ms
 */
function randomDelay(min = 200, max = 600) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * 包装一个 mock 响应：延迟后 resolve { code, data, msg }
 */
function mockResponse(data, code = 200, msg = 'ok') {
  return sleep(randomDelay()).then(() => ({ code, data, msg }));
}

/** 失败响应 */
function mockError(msg = '操作失败', code = 500, data = null) {
  return sleep(randomDelay()).then(() => ({ code, data, msg }));
}

module.exports = { randomDelay, sleep, mockResponse, mockError };
