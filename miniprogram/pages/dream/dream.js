const api = require('../../utils/api')

Page({
  data: {
    // 预设梦境选项
    dreamOptions: [
      { key: 'chase', name: '被人追', icon: '🏃' },
      { key: 'drown', name: '淹死', icon: '🌊' },
      { key: 'statue', name: '神像', icon: '🗿' },
      { key: 'dog', name: '狗', icon: '🐕' },
      { key: 'stranger', name: '陌生人', icon: '👤' },
      { key: 'snake', name: '蛇', icon: '🐍' }
    ],
    customDream: '',
    isLoading: false,
    dreamResult: null
  },

  // 点击预设梦境直接解梦（去掉确认弹窗）
  analyzeDreamDirect(e) {
    if (this.data.isLoading) return

    const { name } = e.currentTarget.dataset
    console.log('点击预设梦境:', name)
    
    // 直接开始解梦，不需要确认
    this.startDreamAnalysis(name)
  },

  // 解梦自定义输入的梦境
  analyzeCustomDream() {
    if (this.data.isLoading) return

    const dreamDescription = this.data.customDream.trim()
    if (!dreamDescription) {
      wx.showToast({
        title: '请描述您的梦境',
        icon: 'none'
      })
      return
    }

    this.startDreamAnalysis(dreamDescription)
  },

  // 开始解梦分析（统一的解梦逻辑）
  async startDreamAnalysis(dreamDescription) {
    this.setData({
      isLoading: true,
      dreamResult: null
    })

    try {
      console.log('开始解梦:', dreamDescription)
      
      // 调用解梦API
      const result = await api.analyzeDream(dreamDescription)
      
      this.setData({
        isLoading: false,
        dreamResult: result
      })
      
      // 成功提示
      wx.showToast({
        title: '解梦完成！',
        icon: 'success',
        duration: 1500
      })
      
      // 轻微震动反馈
      wx.vibrateShort({
        type: 'light'
      })

      // 滚动到结果区域
      setTimeout(() => {
        wx.pageScrollTo({
          selector: '.result-container',
          duration: 300
        })
      }, 500)

    } catch (error) {
      console.error('解梦失败:', error)
      
      this.setData({
        isLoading: false
      })
      
      // 显示错误信息
      wx.showModal({
        title: '解梦失败',
        content: error.message || '网络连接失败，请检查网络后重试',
        showCancel: true,
        cancelText: '取消',
        confirmText: '重试',
        success: (res) => {
          if (res.confirm) {
            setTimeout(() => {
              this.startDreamAnalysis(dreamDescription)
            }, 500)
          }
        }
      })
    }
  },

  // 自定义梦境输入
  onDreamInput(e) {
    const value = e.detail.value
    this.setData({
      customDream: value
    })
  },

  // 重新解梦
  resetDream() {
    this.setData({
      customDream: '',
      dreamResult: null,
      isLoading: false
    })
    
    // 轻微震动反馈
    wx.vibrateShort({
      type: 'light'
    })

    // 滚动到顶部
    wx.pageScrollTo({
      scrollTop: 0,
      duration: 300
    })
  },

  // 分享功能
  onShareAppMessage() {
    const result = this.data.dreamResult
    if (result) {
      return {
        title: `我解了一个梦：${result.dreamDescription}`,
        path: '/pages/dream/dream',
        imageUrl: ''
      }
    }
    
    return {
      title: '周公解梦 - 探索梦境的秘密',
      path: '/pages/dream/dream'
    }
  },

  // 页面加载
  onLoad() {
  },

  // 页面显示时
  onShow() {
    // 清除之前的状态（如果需要的话）
    if (this.data.isLoading) {
      this.setData({
        isLoading: false
      })
    }
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.resetDream()
    wx.stopPullDownRefresh()
  }
})