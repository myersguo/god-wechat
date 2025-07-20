const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件配置
app.use(helmet()); // 安全头设置
app.use(express.json({ limit: '10mb' })); // 解析JSON，限制大小
app.use(express.urlencoded({ extended: true }));

// CORS 配置
const corsOptions = {
  origin: function (origin, callback) {
    // 允许的域名列表
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [];
    
    // 开发环境允许所有来源
    if (process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }
    
    // 生产环境检查来源
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

app.use(cors(corsOptions));

// 限流配置
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15分钟
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // 限制每个IP 15分钟内最多100个请求
  message: {
    error: 'Too many requests',
    message: '请求过于频繁，请稍后再试'
  },
  standardHeaders: true,
  legacyHeaders: false
});

app.use('/api/', limiter);

// 日志中间件
app.use((req, res, next) => {
  if (process.env.ENABLE_LOGGING === 'true') {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} - ${req.ip}`);
  }
  next();
});

// 求签类型配置
const FORTUNE_TYPES = [
  { type: '上签', typeClass: 'excellent', weight: 15 },
  { type: '中签', typeClass: 'good', weight: 40 },
  { type: '下签', typeClass: 'fair', weight: 35 },
  { type: '下下签', typeClass: 'poor', weight: 10 }
];

// 根据权重随机选择签型
function getRandomFortuneType() {
  const totalWeight = FORTUNE_TYPES.reduce((sum, item) => sum + item.weight, 0);
  let random = Math.random() * totalWeight;
  
  for (let item of FORTUNE_TYPES) {
    random -= item.weight;
    if (random <= 0) {
      return item;
    }
  }
  
  return FORTUNE_TYPES[1]; // 默认返回中签
}

// 默认签语描述
function getDefaultDescription(type) {
  const descriptions = {
    '上签': '吉星高照，万事如意',
    '中签': '平安顺遂，静待时机',
    '下签': '谨慎行事，积极努力',
    '下下签': '困难暂时，坚持必胜'
  };
  return descriptions[type] || '心诚则灵';
}

// 调用AI接口
async function callAI(fortuneType) {
  const prompt = `你是一个资深的算命师傅，现在有人求到了一个"${fortuneType.type}"。请你用中国传统文化的方式，给出这个签的含义和解释。

要求：
1. 给出一个4-8字的签语描述
2. 给出详细的解释和建议
3. 语言要古典优雅，但通俗易懂
4. 内容要积极正面，给人希望和指导

请按以下JSON格式返回：
{
  "title": "${fortuneType.type}",
  "description": "签语描述",
  "advice": "详细解释和建议"
}`;

  try {
    const response = await axios.post(
      process.env.AI_BASE_URL,
      {
        model: process.env.AI_MODEL,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.8,
        max_tokens: 500
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.AI_API_KEY}`
        },
        timeout: 30000 // 30秒超时
      }
    );

    if (response.data.choices && response.data.choices.length > 0) {
      const content = response.data.choices[0].message.content;
      
      try {
        return JSON.parse(content);
      } catch (e) {
        // 如果不是JSON格式，返回原始内容
        return {
          title: fortuneType.type,
          description: getDefaultDescription(fortuneType.type),
          advice: content
        };
      }
    } else {
      throw new Error('AI API返回数据格式错误');
    }
  } catch (error) {
    console.error('AI API调用失败:', error.message);
    throw error;
  }
}

// API 路由

// 健康检查
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// 求签接口
app.post('/api/fortune', async (req, res) => {
  try {
    console.log('收到求签请求');
    
    // 1. 随机选择签型
    const fortuneType = getRandomFortuneType();
    console.log('选中签型:', fortuneType.type);
    
    let result;
    
    try {
      // 2. 调用AI获取详细内容
      const aiResult = await callAI(fortuneType);
      
      result = {
        type: fortuneType.type,
        typeClass: fortuneType.typeClass,
        title: aiResult.title || fortuneType.type,
        description: aiResult.description || getDefaultDescription(fortuneType.type),
        advice: aiResult.advice || '心诚则灵，万事顺遂。',
        timestamp: new Date().toISOString()
      };
      
      console.log('AI调用成功');
    } catch (aiError) {
      console.error('AI调用失败，使用默认内容:', aiError.message);
      
      // AI调用失败时使用默认内容
      result = {
        type: fortuneType.type,
        typeClass: fortuneType.typeClass,
        title: fortuneType.type,
        description: getDefaultDescription(fortuneType.type),
        advice: '遇事不要慌张，保持内心平静，相信一切都会朝好的方向发展。',
        timestamp: new Date().toISOString(),
        fallback: true
      };
    }
    
    res.json({
      success: true,
      data: result
    });
    
  } catch (error) {
    console.error('求签接口错误:', error);
    res.status(500).json({
      success: false,
      error: '服务器内部错误',
      message: process.env.NODE_ENV === 'development' ? error.message : '求签服务暂时不可用'
    });
  }
});

// 获取签型统计（可选功能）
app.get('/api/fortune/types', (req, res) => {
  res.json({
    success: true,
    data: FORTUNE_TYPES.map(item => ({
      type: item.type,
      typeClass: item.typeClass,
      weight: item.weight,
      probability: `${(item.weight / FORTUNE_TYPES.reduce((sum, t) => sum + t.weight, 0) * 100).toFixed(1)}%`
    }))
  });
});

// 错误处理中间件
app.use((error, req, res, next) => {
  console.error('服务器错误:', error);
  res.status(500).json({
    success: false,
    error: '服务器内部错误',
    message: process.env.NODE_ENV === 'development' ? error.message : '服务暂时不可用'
  });
});

// 404处理
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: '接口不存在',
    message: `路径 ${req.path} 未找到`
  });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`🚀 Fortune Telling Proxy Server is running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/health`);
  console.log(`🔮 Fortune API: http://localhost:${PORT}/api/fortune`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// 优雅关闭
process.on('SIGTERM', () => {
  console.log('收到SIGTERM信号，正在关闭服务器...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('收到SIGINT信号，正在关闭服务器...');
  process.exit(0);
});
