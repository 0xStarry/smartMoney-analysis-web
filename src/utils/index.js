// 格式化地址，显示前6位和后4位
export const formatAddress = (address) => {
  if (!address) return ''
  if (address.length <= 10) return address
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

// 格式化数字，添加千分符
export const formatNumber = (num) => {
  if (!num && num !== 0) return ''
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

// 格式化日期
export const formatDate = (date) => {
  if (!date) return ''
  const d = new Date(date)
  if (isNaN(d.getTime())) return date
  
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  const seconds = String(d.getSeconds()).padStart(2, '0')
  
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

// Solana区块时间(ms) 转换为北京时间(UTC+8)字符串
export const formatSolanaBlockTimeToUTC8 = (blockTimeMs) => {
  if (!blockTimeMs && blockTimeMs !== 0) return ''
  const date = new Date(Number(blockTimeMs))
  if (isNaN(date.getTime())) return ''
  // 转为 UTC 时间戳，再加上8小时偏移
  const utc8 = new Date(date.getTime() + 8 * 60 * 60 * 1000)
  const year = utc8.getUTCFullYear()
  const month = String(utc8.getUTCMonth() + 1).padStart(2, '0')
  const day = String(utc8.getUTCDate()).padStart(2, '0')
  const hours = String(utc8.getUTCHours()).padStart(2, '0')
  const minutes = String(utc8.getUTCMinutes()).padStart(2, '0')
  const seconds = String(utc8.getUTCSeconds()).padStart(2, '0')
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

// 将毫秒时间戳转为相对时间中文描述
export const formatRelativeTime = (timeMs) => {
  const ts = Number(timeMs)
  if (!ts && ts !== 0) return ''
  const diff = Date.now() - ts
  if (diff < 0) return '刚刚'
  const seconds = Math.floor(diff / 1000)
  if (seconds < 60) return '刚刚'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}分钟前`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}小时前`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}天前`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months}个月前`
  const years = Math.floor(months / 12)
  return `${years}年前`
}

// 验证以太坊地址
export const isValidAddress = (address) => {
  if (!address) return false
  return /^0x[a-fA-F0-9]{40}$/.test(address)
}



// 防抖函数
export const debounce = (func, wait = 300) => {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

// 节流函数
export const throttle = (func, limit = 300) => {
  let lastFunc
  let lastRan
  return function(...args) {
    if (!lastRan) {
      func.apply(this, args)
      lastRan = Date.now()
    } else {
      clearTimeout(lastFunc)
      lastFunc = setTimeout(() => {
        if ((Date.now() - lastRan) >= limit) {
          func.apply(this, args)
          lastRan = Date.now()
        }
      }, limit - (Date.now() - lastRan))
    }
  }
}