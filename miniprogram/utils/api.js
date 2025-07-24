// API配置
const CLOUD_CONFIG = {
    env: 'prod-0g1xepwt370c1525', // 你的云环境ID
    service: 'express-4jbr', // 你的服务名称
    path: '/api/fortune',
    dreamPath: '/api/dream',
  }

// 获取求签结果的主函数
function getFortune() {
  return new Promise((resolve, reject) => {
    wx.cloud.callContainer({
      config: {
        env: CLOUD_CONFIG.env
      },
      path: CLOUD_CONFIG.path,
      header: {
        'X-WX-SERVICE': CLOUD_CONFIG.service,
        'Content-Type': 'application/json'
      },
      method: 'POST',
      data: {
        action: 'getFortune',
        timestamp: Date.now(),
      },
      success: (res) => {
        try {
          // 检查响应状态
          if (res.statusCode === 200) {
            const data = res.data
            
            // 检查业务状态
            if (data.success) {
              resolve(data.data)
            } else {
              console.error('求签业务失败:', data.message)
              reject(new Error(data.message || '求签失败'))
            }
          } else {
            console.error('HTTP状态码错误:', res.statusCode, res.data)
            reject(new Error(`服务器错误: ${res.statusCode}`))
          }
        } catch (error) {
          console.error('解析响应数据失败:', error)
          reject(new Error('数据解析失败'))
        }
      },
      fail: (error) => {
        console.error('云托管API调用失败:', error)
        
        // 提供更友好的错误信息
        let errorMessage = '网络连接失败'
        
        if (error.errMsg) {
          if (error.errMsg.includes('timeout')) {
            errorMessage = '请求超时，请检查网络连接'
          } else if (error.errMsg.includes('fail')) {
            errorMessage = '服务暂时不可用，请稍后重试'
          }
        }
        
        reject(new Error(errorMessage))
      }
    })
  })
}

// 获取签型统计信息（可选功能）
function getFortuneTypes() {
  return new Promise((resolve, reject) => {
    wx.cloud.callContainer({
      config: {
        env: CLOUD_CONFIG.env
      },
      path: '/api/fortune/types',
      header: {
        'X-WX-SERVICE': CLOUD_CONFIG.service
      },
      method: 'GET',
      success: (res) => {
        if (res.statusCode === 200 && res.data.success) {
          resolve(res.data.data)
        } else {
          reject(new Error(res.data.message || '获取签型失败'))
        }
      },
      fail: (error) => {
        console.error('获取签型失败:', error)
        reject(error)
      }
    })
  })
}

// 健康检查（可选功能）
function healthCheck() {
  return new Promise((resolve, reject) => {
    wx.cloud.callContainer({
      config: {
        env: CLOUD_CONFIG.env
      },
      path: '/health',
      header: {
        'X-WX-SERVICE': CLOUD_CONFIG.service
      },
      method: 'GET',
      success: (res) => {
        if (res.statusCode === 200) {
          resolve(res.data)
        } else {
          reject(new Error('服务不健康'))
        }
      },
      fail: (error) => {
        console.error('健康检查失败:', error)
        reject(error)
      }
    })
  })
}

function analyzeDream(dreamDescription) {
    return new Promise((resolve, reject) => {
      wx.cloud.callContainer({
        config: {
          env: CLOUD_CONFIG.env
        },
        path: CLOUD_CONFIG.dreamPath,
        header: {
          'X-WX-SERVICE': CLOUD_CONFIG.service,
          'Content-Type': 'application/json'
        },
        method: 'POST',
        data: {
          action: 'analyzeDream',
          dreamDescription: dreamDescription,
          timestamp: Date.now()
        },
        success: (res) => {
          try {
            if (res.statusCode === 200) {
              const data = res.data
              
              if (data.success) {
                resolve(data.data)
              } else {
                console.error('解梦业务失败:', data.message)
                reject(new Error(data.message || '解梦失败'))
              }
            } else {
              console.error('HTTP状态码错误:', res.statusCode, res.data)
              reject(new Error(`服务器错误: ${res.statusCode}`))
            }
          } catch (error) {
            console.error('解析响应数据失败:', error)
            reject(new Error('数据解析失败'))
          }
        },
        fail: (error) => {
          console.error('解梦API调用失败:', error)
          
          let errorMessage = '网络连接失败'
          
          if (error.errMsg) {
            if (error.errMsg.includes('timeout')) {
              errorMessage = '请求超时，请检查网络连接'
            } else if (error.errMsg.includes('fail')) {
              errorMessage = '服务暂时不可用，请稍后重试'
            }
          }
          
          reject(new Error(errorMessage))
        }
      })
    })
  }

// 算命分析函数
function calculateFortune(userInfo) {
  return new Promise((resolve, reject) => {
    console.log('开始调用算命API...', userInfo)
    
    wx.cloud.callContainer({
      config: {
        env: CLOUD_CONFIG.env
      },
      path: '/api/calculate-fortune',
      header: {
        'X-WX-SERVICE': CLOUD_CONFIG.service,
        'Content-Type': 'application/json'
      },
      method: 'POST',
      data: {
        action: 'calculateFortune',
        userInfo: userInfo,
        timestamp: Date.now()
      },
      success: (res) => {
        console.log('算命API调用成功:', res)
        
        try {
          if (res.statusCode === 200) {
            const data = res.data
            
            if (data.success) {
              console.log('算命成功:', data.data)
              resolve(data.data)
            } else {
              console.error('算命业务失败:', data.message)
              reject(new Error(data.message || '算命失败'))
            }
          } else {
            console.error('HTTP状态码错误:', res.statusCode, res.data)
            reject(new Error(`服务器错误: ${res.statusCode}`))
          }
        } catch (error) {
          console.error('解析响应数据失败:', error)
          reject(new Error('数据解析失败'))
        }
      },
      fail: (error) => {
        console.error('算命API调用失败:', error)
        
        let errorMessage = '网络连接失败'
        
        if (error.errMsg) {
          if (error.errMsg.includes('timeout')) {
            errorMessage = '请求超时，请检查网络连接'
          } else if (error.errMsg.includes('fail')) {
            errorMessage = '服务暂时不可用，请稍后重试'
          }
        }
        
        reject(new Error(errorMessage))
      }
    })
  })
}

module.exports = {
  getFortune,
  analyzeDream,
  calculateFortune, 
  getFortuneTypes,
  healthCheck
}
