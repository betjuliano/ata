// Configuração PM2 para produção
// Deploy: root@72.60.5.74:~/ata/

module.exports = {
  apps: [{
    name: 'ata-audio-backend',
    script: './server.js',
    cwd: '/root/ata',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    error_file: '/root/ata/logs/err.log',
    out_file: '/root/ata/logs/out.log',
    log_file: '/root/ata/logs/combined.log',
    time: true,
    merge_logs: true,
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
  }],

  deploy: {
    production: {
      user: 'root',
      host: '72.60.5.74',
      ref: 'origin/main',
      repo: 'git@github.com:usuario/sistema-ata-audio.git', // Alterar para seu repo
      path: '/root/ata',
      'post-deploy': 'npm install --production && npx prisma generate && npx prisma db push && pm2 reload ecosystem.config.js --env production',
      'pre-setup': 'mkdir -p /root/ata/logs'
    }
  }
}


