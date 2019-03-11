module.exports = {
  apps: [{
    name: 'ecsu-server',
    script: 'dist/index.js',
    cwd: `${process.env.PWD}`,

    // Options reference: https://pm2.io/doc/en/runtime/reference/ecosystem-file/
    env: {
      NODE_ENV: 'development'
    },
    env_production: {
      NODE_ENV: 'production'
    }
  }]
};
