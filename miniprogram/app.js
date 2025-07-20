App({
  onLaunch: function () {
    console.log('求签小程序启动')
    // 初始化云开发
    if (wx.cloud) {
      wx.cloud.init({
        env: 'prod-0g1xepwt370c1525', // 你的云环境ID
        traceUser: true
      })
      console.log('云开发初始化成功')
    } else {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力')
    }
  },
  
  globalData: {
    userInfo: null
  }
})