module.exports = {
  apps: [{
    name: 'redbook-crawler',
    script: './src/server.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    out_file: '/app/logs/out.log',
    error_file: '/app/logs/error.log',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
};