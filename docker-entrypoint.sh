#!/bin/sh

# 如果挂载的数据目录为空，则复制初始数据
if [ -z "$(ls -A /app/data)" ]; then
    echo "Data directory is empty, copying initial data..."
    cp -r /app/src/data/* /app/data/
fi

# 启动应用
exec pm2-runtime start pm2.start.config.cjs