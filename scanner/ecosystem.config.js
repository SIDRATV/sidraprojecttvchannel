module.exports = {
  apps: [
    {
      name: 'blockchain-scanner',
      script: 'loop.js',
      cwd: '/opt/sidra/scanner',
      env_file: '/opt/sidra/scanner/.env',
      restart_delay: 5000,
      max_restarts: 50,
      autorestart: true,
      watch: false,
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      error_file: '/opt/sidra/logs/scanner-error.log',
      out_file: '/opt/sidra/logs/scanner-out.log',
      merge_logs: true,
      max_memory_restart: '256M',
    },
  ],
};
