import express from 'express';
import noteRouter from './routes/note.js';
import responseHandler from './middleware/response.js';

const app = express();
const port = process.env.PORT || 3000;

// 在路由之前加载响应处理中间件
app.use(responseHandler());

app.use('/api/note', noteRouter);

app.listen(port, () => {
  console.log(`服务器运行在 http://localhost:${port}`);
});