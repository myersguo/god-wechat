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
    this.setData({
      fortuneResult: null,
      isLoading: false,
      isShaking: false
    })
  },

  // 页面加载
  onLoad() {
    console.log('求签页面加载完成')
  }
})