import app from './app.js';
import config from './config/index.js';
import { query } from './db/index.js';
import './workers/downloadWorker.js';

const startServer = async () => {
  try {
    // Test database connection
    await query("SELECT 1 as val");
    console.log('✓ SQLite connected');

    // Initialize schema
    const { readFileSync } = await import('fs');
    const { fileURLToPath } = await import('url');
    const { dirname, join } = await import('path');
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);

    const schema = readFileSync(join(__dirname, 'db', 'schema.sql'), 'utf-8');
    
    // SQLite query doesn't like multiple statements in one call without db.exec.
    // We break statements on semicolons to initialize them safely.
    const statements = schema.split(';').filter(stmt => stmt.trim());
    for (const stmt of statements) {
      await query(stmt);
    }
    console.log('✓ Database schema initialized');

    // Start Express server
    app.listen(config.port, () => {
      console.log(`✓ Server running on port ${config.port}`);
      console.log(`  Environment: ${config.nodeEnv}`);
      console.log(`  API: http://localhost:${config.port}/api`);
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
