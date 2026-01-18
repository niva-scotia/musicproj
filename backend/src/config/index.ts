import pool from './db';
import neo4jDb from './neo4j';
import redisDb from './redis';

export async function initializeDatabases() {
  try {
    // Test PostgreSQL
    await pool.query('SELECT NOW()');
    
    // Connect Neo4j
    await neo4jDb.connect();
    
    // Connect Redis
    await redisDb.connect();

    console.log('🚀 All databases initialized');
  } catch (err) {
    console.error('Failed to initialize databases:', err);
    process.exit(1);
  }
}

export async function closeDatabases() {
  await pool.end();
  await neo4jDb.close();
  await redisDb.close();
  console.log('All database connections closed');
}

export { pool, neo4jDb, redisDb };