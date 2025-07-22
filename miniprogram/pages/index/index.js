const api = require('../../utils/api')

Page({
  data: {
    isLoading: false,
    isShaking: false,
    fortuneResult: null
  },

  // 求签方法
  async drawFortune() {
    if (this.data.isLoading) return
    
    this.setData({
      isLoading: true,
      isShaking: true,
      fortuneResult: null
    })

    try {
      // 添加一些延时效果，增加仪式感
      setTimeout(() => {
        this.setData({ isShaking: false })
      }, 500)

      // 调用API获取求签结果
      const result = await api.getFortune()
      
      // 稍微延时后显示结果
      setTimeout(() => {
        this.setData({
          isLoading: false,
          fortuneResult: result
        })
        
        // 显示成功提示
        wx.showToast({
          title: '求签成功！',
          icon: 'success',
          duration: 1500
        })
      }, 1000)

    } catch (error) {
      console.error('求签失败:', error)
      
      this.setData({ 
        isLoading: false,
        isShaking: false
      })
      
      wx.showToast({
        title: '求签失败，请重试',
        icon: 'error',
        duration: 2000
      })
    }
  },

  // 重新求签
  resetFortune() {
    this.drawFortune()
  },

onShareAppMessage() {
    const result = this.data.fortuneResult
    if (result) {
      return {
        title: `我求到了${result.title}！${result.description}`,
        path: '/pages/index/index',
        imageUrl: '' // 可以设置分享图片
      }
    }
    
    return {
      title: '灵签祈福 - 心诚则灵',
      path: '/pages/index/index'
    }
  },
  
  onShareTimeline() {
    const result = this.data.fortuneResult
    if (result) {
      return {
        title: `我求到了${result.title}！${result.description}`,
        imageUrl: ''
      }
    }
    
    return {
      title: '灵签祈福 - 心诚则灵'
    }
  },

  // 页面加载
  onLoad() {
  }
})