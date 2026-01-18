import neo4j, { Driver, Session } from 'neo4j-driver';
import dotenv from 'dotenv';

dotenv.config();

class Neo4jConnection {
  private driver: Driver | null = null;

  async connect(): Promise<Driver> {
    if (this.driver) return this.driver;

    this.driver = neo4j.driver(
      process.env.NEO4J_URI || 'bolt://localhost:7687',
      neo4j.auth.basic(
        process.env.NEO4J_USER || 'neo4j',
        process.env.NEO4J_PASSWORD || 'password'
      )
    );

    try {
      await this.driver.verifyConnectivity();
      console.log('✅ Neo4j connected');
      return this.driver;
    } catch (err) {
      console.error('❌ Neo4j connection error:', err);
      throw err;
    }
  }

  getSession(): Session {
    if (!this.driver) throw new Error('Neo4j not connected');
    return this.driver.session();
  }

  async runQuery(cypher: string, params: Record<string, any> = {}) {
    const session = this.getSession();
    try {
      const result = await session.run(cypher, params);
      return result.records;
    } finally {
      await session.close();
    }
  }

  async close(): Promise<void> {
    if (this.driver) {
      await this.driver.close();
      this.driver = null;
    }
  }
}

export const neo4jDb = new Neo4jConnection();
export default neo4jDb;