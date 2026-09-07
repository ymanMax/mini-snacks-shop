// mock/util.js —— mock 层通用方法（时间、金额、分页）

function round2(n) {
  return Math.round((Number(n) + Number.EPSILON) * 100) / 100;
}

function pad(n) {
  return n < 10 ? '0' + n : '' + n;
}

// 格式：YYYY-MM-DD HH:mm:ss
function fmtTime(date) {
  const d = date instanceof Date ? date : new Date(date);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ` +
    `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function fmtDate(date) {
  const d = date instanceof Date ? date : new Date(date);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// 相对当前时间偏移（天/小时/分钟）
function offsetTime(days = 0, hours = 0, minutes = 0) {
  return fmtTime(new Date(Date.now() + days * 86400000 + hours * 3600000 + minutes * 60000));
}

function genOrderNo() {
  const d = new Date();
  let s = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
  s += Math.floor(100000 + Math.random() * 900000);
  return s;
}

// 统一分页切片：返回 { records, total, current, size, pages }
function paginate(list, params = {}) {
  const current = Math.max(1, parseInt(params.current, 10) || 1);
  const size = Math.max(1, parseInt(params.size, 10) || 10);
  const total = list.length;
  const pages = Math.max(1, Math.ceil(total / size));
  const records = list.slice((current - 1) * size, current * size);
  return { records, total, current, size, pages };
}

// 深拷贝（仅用于可序列化的 mock 数据）
function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

module.exports = {
  round2,
  pad,
  fmtTime,
  fmtDate,
  offsetTime,
  genOrderNo,
  paginate,
  clone
};
