# RedBookCrawler

小红书评论爬虫工具，支持 Docker 部署。

## 功能特点

- 支持批量爬取小红书笔记评论
- 自动保存为 CSV 格式
- 支持子评论爬取
- Docker 容器化部署
- PM2 进程守护
- Cookie 池管理
- 自动重试机制

## 使用说明

### 1. 配置文件

在 `data` 目录下创建以下文件：

- `cookie.js`: Cookie 配置文件
```javascript
export default [
  'your-cookie-string-here'
]
```

## 快速开始

### Docker 部署

1. 拉取镜像：
```bash
docker pull your-username/redbook-crawler:latest
```
2. 创建必要目录：
```bash
mkdir -p data logs
 ```

3. 运行容器：
```bash
docker run -d \
  --name redbook-crawler \
  -p 13000:3000 \
  -v $(pwd)/data:/app/data \
  -v $(pwd)/logs:/app/logs \
  redbook-crawler:latest
 ```

## 数据目录说明
- data/ : 存放爬取的数据和配置文件
- logs/ : 存放运行日志
## 注意事项
- 请确保 data 目录中包含 note_list.js 文件
- 建议定期备份数据目录
- 查看日志： docker logs redbook-crawler