FROM node:18

WORKDIR /app

# 全局安装 PM2
RUN npm install pm2 -g

# 先复制 package.json
COPY package*.json ./
RUN npm install

# 复制所有源代码和数据
COPY . .

# 确保数据目录存在并设置权限
RUN mkdir -p /app/data /app/logs && \
    chmod -R 777 /app/data /app/logs

EXPOSE 3000

# 创建启动脚本
COPY docker-entrypoint.sh /
RUN chmod +x /docker-entrypoint.sh

# 使用启动脚本
ENTRYPOINT ["/docker-entrypoint.sh"]

# 使用 PM2 运行时启动应用
CMD ["pm2-runtime", "start", "pm2.start.config.cjs"]