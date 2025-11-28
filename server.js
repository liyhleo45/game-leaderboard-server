// --- 1. 引入必要的模块 ---
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors'); // 用于解决跨域问题 (CORS)

// --- 2. 配置常量 ---
const app = express();
const PORT = 3000;
// 您的 MongoDB 真实密码
const MONGODB_PASSWORD = 'hh080326'; 
// 使用您的连接字符串和密码构建最终的 URI
const DB_URI = `mongodb+srv://liyhleo45_db_user:${MONGODB_PASSWORD}@cluster0.tmpxwys.mongodb.net/leaderboardDB?retryWrites=true&w=majority`;


// --- 3. 配置中间件 ---
// 允许 Express 解析前端传来的 JSON 格式数据
app.use(express.json()); 
// 允许所有来源的域名访问您的 API (解决本地文件运行时的 CORS 问题)
app.use(cors()); 


// --- 4. 数据库连接 ---
mongoose.connect(DB_URI)
  .then(() => console.log('✅ MongoDB 连接成功!'))
  .catch(err => {
    console.error('❌ MongoDB 连接失败:', err.message);
    console.error('请检查您的密码、IP白名单和连接字符串是否正确。');
  });


// --- 5. 数据库模型定义 (Schema) ---
// 定义排行榜数据的结构
const ScoreSchema = new mongoose.Schema({
  username: { type: String, required: true, trim: true },
  score: { type: Number, required: true, default: 0 },
  // 日期格式必须是 YYYY-MM-DD
  record_date: { type: String, required: true },
});

// 创建 Mongoose 模型
const ScoreModel = mongoose.model('Score', ScoreSchema);


// --- 6. API 接口定义 ---

// 6.1 POST 接口：提交分数 (每日最高分逻辑)
app.post('/api/score', async (req, res) => {
  const { username, score, record_date } = req.body;

  if (!username || typeof score !== 'number' || !record_date) {
    return res.status(400).json({ message: '数据格式错误，缺少用户名、分数或日期。' });
  }

  try {
    const existingScore = await ScoreModel.findOne({ username, record_date });

    if (existingScore) {
      if (score > existingScore.score) {
        existingScore.score = score;
        await existingScore.save();
        return res.json({ success: true, message: '分数已更新为今日最高分！', score });
      } else {
        return res.json({ success: false, message: '分数低于或等于今日最高分，未更新。' });
      }
    } else {
      const newScore = new ScoreModel({ username, score, record_date });
      await newScore.save();
      return res.status(201).json({ success: true, message: '新记录已创建！', score });
    }
  } catch (error) {
    console.error('提交分数时发生错误:', error);
    return res.status(500).json({ success: false, message: '服务器内部错误。' });
  }
});


// 6.2 GET 接口：获取排行榜数据
app.get('/api/leaderboard', async (req, res) => {
  try {
    const leaderboard = await ScoreModel.find({})
      .sort({ record_date: -1, score: -1 })
      .limit(100); 

    res.json(leaderboard);
  } catch (error) {
    console.error('获取排行榜时发生错误:', error);
    res.status(500).json({ message: '服务器内部错误。' });
  }
});


// --- 7. 启动服务器 ---
app.listen(PORT, () => {
  console.log(`🚀 服务器已启动，正在监听端口: http://localhost:${PORT}`);
});