module.exports = {
  apps : [{
    name   : "sudi-backend",
    cwd    : __dirname,
    script : "./dist/index.js", // Run the compiled file
    interpreter: "node",      // Use the standard node interpreter
    env: {
      "NODE_ENV": "development",
    },
    env_production : {
       "NODE_ENV": "production",
       "SMTP_HOST": "127.0.0.1",
       "SMTP_PORT": 587,
       "SMTP_SECURE": false,
       "SMTP_USER": "undangan-noreply@ai.sudi.pro",
       "SMTP_PASS": "123456789",
       "BLAST_SMTP_USER": "undangan-noreply@ai.sudi.pro",
       "BLAST_SMTP_PASS": "123456789",
       "JWT_SECRET": "JWT_SECRET_HERE"
    }
  }]
}
