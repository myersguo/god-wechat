const express = require('express');
const helmet = require('helmet');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const AI_BASE_URL = process.env.AI_BASE_URL || 'https://ark.cn-beijing.volces.com/api/v3/chat/completions';
const AI_MODEL = process.env.AI_MODEL || 'ep-20250616101553-lgj29';
const AI_API_KEY = process.env.AI_API_KEY;

// 中间件配置
app.set('trust proxy', true);

app.use(helmet()); // 安全头设置
app.use(express.json({ limit: '10mb' })); // 解析JSON，限制大小
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-WX-SERVICE');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// 微信云托管请求日志
app.use((req, res, next) => {
  const wxService = req.headers['x-wx-service'];
  const realIP = req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  
  if (process.env.ENABLE_LOGGING === 'true') {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} - IP: ${realIP} - WX-SERVICE: ${wxService}`);
  }
  next();
});


// 六十四支签类型映射
const FORTUNE_TYPE_MAPPING = {
  '大吉': 'excellent',
  '中吉': 'good',
  '小吉': 'good',
  '吉': 'good',
  '中平': 'fair',
  '平': 'fair',
  '小凶': 'poor',
  '凶': 'poor',
  '大凶': 'poor'
};

// 根据签名获取CSS类名
function getFortuneTypeClass(fortuneType) {
  return FORTUNE_TYPE_MAPPING[fortuneType] || 'fair';
}

// 默认签语描述
function getDefaultDescription(type) {
  const descriptions = {
    '大吉': '福星高照，万事如意',
    '中吉': '吉星相伴，好运连连',
    '小吉': '小有收获，渐入佳境',
    '吉': '顺心如意，平安喜乐',
    '中平': '平安顺遂，静待时机',
    '平': '平稳发展，保持现状',
    '小凶': '谨慎行事，化险为夷',
    '凶': '困难暂时，积极应对',
    '大凶': '逆境考验，坚持必胜'
  };
  return descriptions[type] || '心诚则灵';
}

// 调用AI接口获取六十四支签
async function callAI() {
  const userContext = getRandomQuestionContext(); // ⬅️ 加入求问者情境

  const prompt = `你是一位德高望重的传统签诗占卜师，精通《六十四签》的古典体系，熟悉各大签谱（如：观音签、黄大仙签、吕祖签、月老签等），晓天时地理、通人情世理。现有一位缘主前来求签，请你依古礼拈签、解签，为其指点迷津，趋吉避凶。

${userContext}

签诗共有六十四支，按传统分为“第X签”，并附有吉凶等级与古典签语，涵盖人生各个面向（爱情、事业、财运、健康、学业等），有深厚的象征意义和劝世之道。

为增强内容变化性，请在签诗中从以下元素中随机选择意象或典故作为灵感来源：
- 自然象征（如：风、火、雷、电、山、川、松、月、云、舟、雾）；
- 历史人物（如：诸葛亮、岳飞、李白、苏秦、文王、韩信）；
- 吉祥物象（如：龙、凤、麒麟、龟、鹤、梅、竹、兰、菊）；
- 古代器物（如：玉印、铜镜、宝剑、锦囊、丝帕）；
- 从爱情、事业、财运、健康、学业中随机选择一类进行解读。

请严格按以下 JSON 格式输出：

{
  "signNumber": "第X签",
  "fortuneType": "吉凶等级（如：大吉、中吉、小吉、吉、中平、平、小凶、凶、大凶）",
  "description": "4~8字古典签语，如：风起云开日自明",
  "advice": "详细解释和建议，语言古典雅致，通俗易懂，围绕某一类别（如爱情、事业、健康等）进行展开",
  "source": "签诗出处（如：观音签、黄大仙签等）",
  "judgement": "传统断语，简明总结签意，如：事有转机，宜静待时",
  "commentary": "签诗评注，结合签文、象征意涵与现实人情，进行深入剖析与启发"
}
`;

  try {
    const response = await axios.post(
      AI_BASE_URL,
      {
        model: AI_MODEL,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.9, // ⬅️ 加大温度，提升发散性
        top_p: 0.95
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${AI_API_KEY}`
        },
        timeout: 30000
      }
    );

    if (response.data.choices && response.data.choices.length > 0) {
      const content = response.data.choices[0].message.content;
      const cleanedContent = content.replace(/```json\s*|\s*```/g, '');
      const result = JSON.parse(cleanedContent);
      if (result.signNumber && result.fortuneType && result.description && result.advice) {
        return result;
      } else {
        console.error('AI返回数据格式不完整:', result);
        throw new Error('AI返回数据格式不完整');
      }
    } else {
      throw new Error('AI API返回数据格式错误');
    }
  } catch (error) {
    console.error('AI API调用失败:', error.message);
    throw error;
  }
}

function getRandomQuestionContext() {
  const contexts = [
    "缘主心念求问近期姻缘之事。",
    "缘主困于事业之路，欲求签解惑。",
    "缘主忧于财务，想探财运走向。",
    "缘主染疾未愈，求健康之兆。",
    "缘主谋学未成，盼得明示方向。"
  ];
  return contexts[Math.floor(Math.random() * contexts.length)];
}


// 生成默认六十四支签内容
function getDefaultFortuneContent() {
  const signNumbers = Array.from({length: 64}, (_, i) => i + 1);
  const randomSignNumber = signNumbers[Math.floor(Math.random() * signNumbers.length)];
  const fortuneTypes = ['大吉', '中吉', '小吉', '吉', '中平', '平', '小凶', '凶'];
  const weights = [10, 15, 20, 20, 15, 10, 7, 3];
  
  // 根据权重随机选择
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
  let random = Math.random() * totalWeight;
  let selectedType = '中平';
  
  for (let i = 0; i < fortuneTypes.length; i++) {
    random -= weights[i];
    if (random <= 0) {
      selectedType = fortuneTypes[i];
      break;
    }
  }

  return {
    signNumber: `第${randomSignNumber}签`,
    fortuneType: selectedType,
    description: getDefaultDescription(selectedType),
    advice: '心诚则灵，万事顺遂。遇事不要慌张，保持内心平静，相信一切都会朝好的方向发展。'
  };
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
    
    let result;
    
    try {
      // 调用AI获取六十四支签内容
      const aiResult = await callAI();
      
      result = {
        signNumber: aiResult.signNumber,
        type: aiResult.fortuneType,
        typeClass: getFortuneTypeClass(aiResult.fortuneType),
        title: aiResult.signNumber,
        description: aiResult.description,
        advice: aiResult.advice,
        timestamp: new Date().toISOString()
      };
      
      console.log('AI调用成功，签号:', aiResult.signNumber, '签型:', aiResult.fortuneType);
    } catch (aiError) {
      console.error('AI调用失败，使用默认内容:', aiError.message);
      
      // AI调用失败时使用默认内容
      const defaultContent = getDefaultFortuneContent();
      result = {
        signNumber: defaultContent.signNumber,
        type: defaultContent.fortuneType,
        typeClass: getFortuneTypeClass(defaultContent.fortuneType),
        title: defaultContent.signNumber,
        description: defaultContent.description,
        advice: defaultContent.advice,
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

// 获取签型统计（可选功能，更新为六十四支签信息）
app.get('/api/fortune/types', (req, res) => {
  const fortuneTypes = [
    { type: '大吉', typeClass: 'excellent', description: '福星高照，万事如意' },
    { type: '中吉', typeClass: 'good', description: '吉星相伴，好运连连' },
    { type: '小吉', typeClass: 'good', description: '小有收获，渐入佳境' },
    { type: '吉', typeClass: 'good', description: '顺心如意，平安喜乐' },
    { type: '中平', typeClass: 'fair', description: '平安顺遂，静待时机' },
    { type: '平', typeClass: 'fair', description: '平稳发展，保持现状' },
    { type: '小凶', typeClass: 'poor', description: '谨慎行事，化险为夷' },
    { type: '凶', typeClass: 'poor', description: '困难暂时，积极应对' },
    { type: '大凶', typeClass: 'poor', description: '逆境考验，坚持必胜' }
  ];

  res.json({
    success: true,
    data: {
      totalSigns: 64,
      description: '传统六十四支签，包含不同签号和吉凶等级',
      fortuneTypes: fortuneTypes
    }
  });
});

// 解梦相关函数
async function callDreamAI(dreamDescription) {
  const prompt = `你是一位精通周公解梦和现代心理学的解梦大师。用户梦到了：${dreamDescription}

请按照以下格式详细解梦：

1. 梦境分类：给出这个梦境的分类（如：人物行为、自然现象、动物类、物品类等）
2. 传统周公解梦：引用传统《周公解梦》的相关内容，包含古文原句和现代解释
3. 现代心理学解释：从心理学角度分析这个梦境的含义，结合2025年现代社会背景
4. AI智能建议：给出具体的生活建议和化解方法

要求：
- 语言要专业但通俗易懂
- 内容要积极正面，给人希望和指导
- 结合传统文化和现代心理学
- 给出实用的建议

请按以下JSON格式返回：
{
  "dreamDescription": "${dreamDescription}",
  "category": "梦境分类",
  "traditional": "传统周公解梦内容",
  "psychology": "现代心理学解释",
  "advice": "AI智能建议"
}`;

  try {
    const response = await axios.post(
      AI_BASE_URL,
      {
        model: AI_MODEL,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${AI_API_KEY}`
        },
        timeout: 30000
      }
    );

    if (response.data.choices && response.data.choices.length > 0) {
      const content = response.data.choices[0].message.content;

      try {
        // 去掉多余的```json 和``` 标记
        const cleanedContent = content.replace(/```json\s*|\s*```/g, '');
        // 尝试解析JSON内容
        return JSON.parse(cleanedContent);
      } catch (e) {
        // 如果不是JSON格式，返回结构化的默认内容
        return getDefaultDreamAnalysis(dreamDescription);
      }
    } else {
      throw new Error('AI API返回数据格式错误');
    }
  } catch (error) {
    console.error('解梦AI API调用失败:', error.message);
    throw error;
  }
}

// 默认解梦分析
function getDefaultDreamAnalysis(dreamDescription) {
  return {
    dreamDescription: dreamDescription,
    category: "心理反映类",
    traditional: "《周公解梦》有云：梦境乃心之所想，日有所思夜有所梦。此梦反映内心状态，需细心体会其中深意。",
    psychology: "从现代心理学角度看，梦境是潜意识的表达。2025年快节奏的生活中，此类梦境往往反映现实压力和内心期望。",
    advice: "建议保持积极心态，适当放松身心。可尝试瑜伽、冥想等方式调节情绪，遇事多从正面角度思考。"
  };
}

// 解梦接口
app.post('/api/dream', async (req, res) => {
  try {
    console.log('收到解梦请求:', req.body.dreamDescription);

    const dreamDescription = req.body.dreamDescription;

    if (!dreamDescription || !dreamDescription.trim()) {
      return res.status(400).json({
        success: false,
        error: '参数错误',
        message: '梦境描述不能为空'
      });
    }

    let result;

    try {
      // 调用AI解梦
      const aiResult = await callDreamAI(dreamDescription.trim());
      result = aiResult;
      console.log('解梦AI调用成功');
    } catch (aiError) {
      console.error('解梦AI调用失败，使用默认内容:', aiError.message);

      // AI调用失败时使用默认内容
      result = getDefaultDreamAnalysis(dreamDescription.trim());
      result.fallback = true;
    }

    // 添加时间戳
    result.timestamp = new Date().toISOString();

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('解梦接口错误:', error);
    res.status(500).json({
      success: false,
      error: '服务器内部错误',
      message: '解梦服务暂时不可用，请稍后重试'
    });
  }
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
  console.log(`💭 Dream API: http://localhost:${PORT}/api/dream`);
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
