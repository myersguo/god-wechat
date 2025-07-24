const api = require('../../utils/api')

Page({
  data: {
    userInfo: {
      name: '朱元璋',
      gender: 'male',
      birthDate: '1328-10-29',
      birthTime: ''
    },
    isLoading: false,
    fortuneResult: null
  },

  // 姓名输入
  onNameInput(e) {
    this.setData({
      'userInfo.name': e.detail.value
    })
  },

  // 性别选择
  selectGender(e) {
    const gender = e.currentTarget.dataset.gender
    this.setData({
      'userInfo.gender': gender
    })
  },

  // 出生日期选择
  onDateChange(e) {
    this.setData({
      'userInfo.birthDate': e.detail.value
    })
  },

  // 出生时间选择
  onTimeChange(e) {
    this.setData({
      'userInfo.birthTime': e.detail.value
    })
  },

  // 开始算命
  async startFortuneTelling() {
    if (this.data.isLoading) return

    const { name, gender, birthDate, birthTime } = this.data.userInfo

    if (!name.trim()) {
      wx.showToast({
        title: '请输入姓名',
        icon: 'none'
      })
      return
    }

    if (!birthDate) {
      wx.showToast({
        title: '请选择出生日期',
        icon: 'none'
      })
      return
    }

    this.setData({
      isLoading: true,
      fortuneResult: null
    })

    try {
      console.log('开始算命:', { name, gender, birthDate, birthTime })
      
      // 调用算命API
      const result = await api.calculateFortune({
        name: name.trim(),
        gender,
        birthDate,
        birthTime
      })
      
      this.setData({
        isLoading: false,
        fortuneResult: result
      })
      
      // 成功提示
      wx.showToast({
        title: '算命完成！',
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
      console.error('算命失败:', error)
      
      this.setData({
        isLoading: false
      })
      
      // 显示错误信息
      wx.showModal({
        title: '算命失败',
        content: error.message || '网络连接失败，请检查网络后重试',
        showCancel: true,
        cancelText: '取消',
        confirmText: '重试',
        success: (res) => {
          if (res.confirm) {
            setTimeout(() => {
              this.startFortuneTelling()
            }, 500)
          }
        }
      })
    }
  },

  // 重新算命
resetFortune() {
    this.setData({
      userInfo: {
        name: '朱元璋',
        gender: 'male',
        birthDate: '1328-10-29',
        birthTime: ''
      },
      fortuneResult: null,
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
    const result = this.data.fortuneResult
    if (result) {
      return {
        title: `我用AI算命了！${result.name}的运势分析`,
        path: '/pages/fortune/fortune',
        imageUrl: ''
      }
    }
    
    return {
      title: 'AI智能算命 - 解读命运玄机',
      path: '/pages/fortune/fortune'
    }
  },

  // 页面加载
  onLoad() {
    console.log('算命页面加载完成')
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.setData({
      userInfo: {
        name: '朱元璋',
        gender: 'male',
        birthDate: '1328-10-29',
        birthTime: ''
      },
      fortuneResult: null,
      isLoading: false
    })
    wx.stopPullDownRefresh()
  }
})
