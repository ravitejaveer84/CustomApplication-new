import { Pool as PgPool } from '@neondatabase/serverless';
import * as mysql from 'mysql2/promise';
import * as mssql from 'mssql';
import { MongoClient } from 'mongodb';
import oracledb from 'oracledb';
import Database from 'better-sqlite3';
import ws from 'ws';
import { neonConfig } from '@neondatabase/serverless';

// Configure Neon serverless
neonConfig.webSocketConstructor = ws;

export interface DatabaseResponse {
  success: boolean;
  message: string;
  info?: any;
  tables?: string[];
  fields?: Record<string, any[]>;
  error?: Error;
}

export interface QueryResult {
  rows: any[];
  fields?: any[];
  error?: Error;
}

export class DatabaseConnector {
  // Test connection to a database
  static async testConnection(type: string, config: any): Promise<DatabaseResponse> {
    try {
      switch (type.toLowerCase()) {
        case 'postgresql':
          return await this.testPostgresConnection(config);
        case 'mysql':
          return await this.testMySqlConnection(config);
        case 'mongodb':
          return await this.testMongoDbConnection(config);
        case 'mssql':
          return await this.testMsSqlConnection(config);
        case 'oracle':
          return await this.testOracleConnection(config);
        case 'sqlite':
          return await this.testSqliteConnection(config);
        default:
          return {
            success: false,
            message: `Unsupported database type: ${type}`
          };
      }
    } catch (error) {
      console.error('Database connection error:', error);
      return {
        success: false,
        message: `Database connection failed: ${error instanceof Error ? error.message : String(error)}`,
        error: error instanceof Error ? error : new Error(String(error))
      };
    }
  }

  // Execute a query against a database
  static async executeQuery(type: string, config: any, query: string): Promise<QueryResult> {
    try {
      switch (type.toLowerCase()) {
        case 'postgresql':
          return await this.queryPostgres(config, query);
        case 'mysql':
          return await this.queryMySql(config, query);
        case 'mongodb':
          return await this.queryMongoDB(config, query);
        case 'mssql':
          return await this.queryMsSql(config, query);
        case 'oracle':
          return await this.queryOracle(config, query);
        case 'sqlite':
          return await this.querySqlite(config, query);
        default:
          throw new Error(`Unsupported database type: ${type}`);
      }
    } catch (error) {
      console.error('Query execution error:', error);
      return {
        rows: [],
        error: error instanceof Error ? error : new Error(String(error))
      };
    }
  }

  // PostgreSQL connection testing
  private static async testPostgresConnection(config: any): Promise<DatabaseResponse> {
    const { 
      connectionString,
      host,
      server = 'localhost',
      port = 5432,
      database,
      user,
      password
    } = config;

    let pool;
    
    try {
      // Use either connection string or individual parameters
      if (connectionString) {
        pool = new PgPool({ connectionString });
      } else {
        pool = new PgPool({
          host: host || server,
          port: parseInt(port.toString()),
          database,
          user,
          password,
          ssl: true
        });
      }

      const client = await pool.connect();
      
      try {
        // Test the connection
        const versionResult = await client.query('SELECT version()');
        
        // Get metadata about tables in the database
        const tableQuery = await client.query(`
          SELECT table_name, column_name, data_type 
          FROM information_schema.columns 
          WHERE table_schema = 'public' 
          ORDER BY table_name, ordinal_position 
          LIMIT 100
        `);
        
        // Group columns by table to create field metadata
        const fieldsByTable = tableQuery.rows.reduce((acc: any, row: any) => {
          const { table_name, column_name, data_type } = row;
          if (!acc[table_name]) {
            acc[table_name] = [];
          }
          acc[table_name].push({
            name: column_name,
            type: data_type,
            selected: ["id", "name", "title", "email", "description"].includes(column_name.toLowerCase())
          });
          return acc;
        }, {});
        
        return {
          success: true,
          message: 'PostgreSQL connection successful',
          info: {
            server: host || 'via connection string',
            database: database || 'via connection string',
            version: versionResult.rows[0].version
          },
          tables: Object.keys(fieldsByTable),
          fields: fieldsByTable
        };
      } finally {
        client.release();
        await pool.end();
      }
    } catch (error) {
      console.error('PostgreSQL connection error:', error);
      return {
        success: false,
        message: `PostgreSQL connection failed: ${error instanceof Error ? error.message : String(error)}`,
        error: error instanceof Error ? error : new Error(String(error))
      };
    }
  }

  // MySQL connection testing
  private static async testMySqlConnection(config: any): Promise<DatabaseResponse> {
    const { 
      host, 
      server = 'localhost',
      port = 3306, 
      database, 
      user, 
      password 
    } = config;
    
    let connection;
    
    try {
      connection = await mysql.createConnection({
        host: host || server,
        port: parseInt(port.toString()),
        database,
        user,
        password
      });
      
      // Test the connection
      const [versionRows] = await connection.execute('SELECT VERSION() as version');
      const version = Array.isArray(versionRows) && versionRows.length > 0 
        ? (versionRows[0] as any).version 
        : 'Unknown';
      
      // Get metadata about tables in the database
      const [tableRows] = await connection.execute(`
        SELECT 
          TABLE_NAME as table_name, 
          COLUMN_NAME as column_name, 
          DATA_TYPE as data_type 
        FROM 
          INFORMATION_SCHEMA.COLUMNS 
        WHERE 
          TABLE_SCHEMA = ?
        ORDER BY 
          TABLE_NAME, ORDINAL_POSITION 
        LIMIT 100
      `, [database]);
      
      // Group columns by table
      const fieldsByTable = (tableRows as any[]).reduce((acc: any, row: any) => {
        const { table_name, column_name, data_type } = row;
        if (!acc[table_name]) {
          acc[table_name] = [];
        }
        acc[table_name].push({
          name: column_name,
          type: data_type,
          selected: ["id", "name", "title", "email", "description"].includes(column_name.toLowerCase())
        });
        return acc;
      }, {});
      
      return {
        success: true,
        message: 'MySQL connection successful',
        info: {
          server: host,
          database,
          version
        },
        tables: Object.keys(fieldsByTable),
        fields: fieldsByTable
      };
    } catch (error) {
      return {
        success: false,
        message: `MySQL connection failed: ${error instanceof Error ? error.message : String(error)}`,
        error: error instanceof Error ? error : new Error(String(error))
      };
    } finally {
      if (connection) {
        await connection.end();
      }
    }
  }

  // MongoDB connection testing
  private static async testMongoDbConnection(config: any): Promise<DatabaseResponse> {
    const { 
      uri, 
      host = 'localhost', 
      port = 27017, 
      database, 
      username, 
      password 
    } = config;
    
    let client;
    let connectionString = uri;
    
    // Build connection string if not provided
    if (!connectionString) {
      const authPart = username && password 
        ? `${encodeURIComponent(username)}:${encodeURIComponent(password)}@` 
        : '';
      connectionString = `mongodb://${authPart}${host}:${port}/${database}`;
    }
    
    try {
      client = new MongoClient(connectionString);
      await client.connect();
      
      const db = client.db(database);
      
      // Get database info
      const adminDb = client.db('admin');
      const serverInfo = await adminDb.command({ serverStatus: 1 });
      
      // Get collections
      const collections = await db.listCollections().toArray();
      
      // Sample a document from each collection to infer the schema
      const fieldsByCollection: Record<string, any[]> = {};
      
      for (const collection of collections) {
        const collectionName = collection.name;
        fieldsByCollection[collectionName] = [];
        
        // Get a sample document
        const sampleDocs = await db.collection(collectionName).find().limit(1).toArray();
        
        if (sampleDocs.length > 0) {
          const sampleDoc = sampleDocs[0];
          
          // Extract fields from the sample document
          for (const key in sampleDoc) {
            if (key !== '_id') {
              const value = sampleDoc[key];
              let type: string = typeof value;
              
              if (value instanceof Date) {
                type = 'date';
              } else if (Array.isArray(value)) {
                type = 'array';
              } else if (value === null) {
                type = 'null';
              }
              
              fieldsByCollection[collectionName].push({
                name: key,
                type,
                selected: ["id", "name", "title", "email", "description"].includes(key.toLowerCase())
              });
            } else {
              // Always include _id field
              fieldsByCollection[collectionName].push({
                name: key,
                type: 'ObjectId',
                selected: true
              });
            }
          }
        }
      }
      
      return {
        success: true,
        message: 'MongoDB connection successful',
        info: {
          server: host,
          database,
          version: serverInfo.version
        },
        tables: collections.map(c => c.name),
        fields: fieldsByCollection
      };
    } catch (error) {
      return {
        success: false,
        message: `MongoDB connection failed: ${error instanceof Error ? error.message : String(error)}`,
        error: error instanceof Error ? error : new Error(String(error))
      };
    } finally {
      if (client) {
        await client.close();
      }
    }
  }

  // SQL Server connection testing
  private static async testMsSqlConnection(config: any): Promise<DatabaseResponse> {
    const { 
      server, 
      port = 1433, 
      database, 
      user, 
      password, 
      trustServerCertificate = true
    } = config;
    
    try {
      // Configure connection
      const sqlConfig: mssql.config = {
        server,
        port: parseInt(port.toString()),
        database,
        user,
        password,
        options: {
          trustServerCertificate,
          encrypt: true
        }
      };
      
      // Connect to SQL Server
      const pool = await mssql.connect(sqlConfig);
      
      // Test connection by querying SQL Server version
      const versionResult = await pool.request().query('SELECT @@VERSION as version');
      const version = versionResult.recordset[0].version;
      
      // Query schema information
      const tableResult = await pool.request().query(`
        SELECT 
          TABLE_NAME as table_name, 
          COLUMN_NAME as column_name, 
          DATA_TYPE as data_type 
        FROM 
          INFORMATION_SCHEMA.COLUMNS 
        WHERE 
          TABLE_CATALOG = '${database}' 
        ORDER BY 
          TABLE_NAME, ORDINAL_POSITION
      `);
      
      // Group columns by table
      const fieldsByTable = tableResult.recordset.reduce((acc: any, row: any) => {
        const { table_name, column_name, data_type } = row;
        if (!acc[table_name]) {
          acc[table_name] = [];
        }
        acc[table_name].push({
          name: column_name,
          type: data_type,
          selected: ["id", "name", "title", "email", "description"].includes(column_name.toLowerCase())
        });
        return acc;
      }, {});
      
      await pool.close();
      
      return {
        success: true,
        message: 'SQL Server connection successful',
        info: {
          server,
          database,
          version
        },
        tables: Object.keys(fieldsByTable),
        fields: fieldsByTable
      };
    } catch (error) {
      return {
        success: false,
        message: `SQL Server connection failed: ${error instanceof Error ? error.message : String(error)}`,
        error: error instanceof Error ? error : new Error(String(error))
      };
    }
  }

  // Oracle connection testing
  private static async testOracleConnection(config: any): Promise<DatabaseResponse> {
    const { 
      connectString, 
      host, 
      port = 1521, 
      service, 
      user, 
      password 
    } = config;
    
    let connection;
    let connString = connectString;
    
    // Build connection string if not provided
    if (!connString && host && service) {
      connString = `${host}:${port}/${service}`;
    }
    
    try {
      // Initialize oracledb
      if (typeof oracledb.initOracleClient === 'function') {
        try {
          oracledb.initOracleClient();
        } catch (err) {
          console.log('Oracle client already initialized or not needed in this environment');
        }
      }
      
      // Connect to Oracle
      connection = await oracledb.getConnection({
        connectString: connString,
        user,
        password
      });
      
      // Test connection by querying Oracle version
      const versionResult = await connection.execute('SELECT BANNER as version FROM V$VERSION WHERE BANNER LIKE \'Oracle%\'');
      const version = versionResult && versionResult.rows && versionResult.rows.length > 0 ? (versionResult.rows[0] as any[])[0] : 'Unknown';
      
      // Query schema information
      const tableResult = await connection.execute(`
        SELECT 
          TABLE_NAME, 
          COLUMN_NAME, 
          DATA_TYPE 
        FROM 
          ALL_TAB_COLUMNS 
        WHERE 
          OWNER = :owner 
        ORDER BY 
          TABLE_NAME, COLUMN_ID
      `, [user.toUpperCase()], { outFormat: oracledb.OUT_FORMAT_OBJECT });
      
      // Group columns by table
      const fieldsByTable = (tableResult.rows as any[]).reduce((acc: any, row: any) => {
        const { TABLE_NAME, COLUMN_NAME, DATA_TYPE } = row;
        if (!acc[TABLE_NAME]) {
          acc[TABLE_NAME] = [];
        }
        acc[TABLE_NAME].push({
          name: COLUMN_NAME,
          type: DATA_TYPE,
          selected: ["id", "name", "title", "email", "description"].includes(COLUMN_NAME.toLowerCase())
        });
        return acc;
      }, {});
      
      return {
        success: true,
        message: 'Oracle connection successful',
        info: {
          server: host || 'via connection string',
          service: service || 'via connection string',
          version
        },
        tables: Object.keys(fieldsByTable),
        fields: fieldsByTable
      };
    } catch (error) {
      return {
        success: false,
        message: `Oracle connection failed: ${error instanceof Error ? error.message : String(error)}`,
        error: error instanceof Error ? error : new Error(String(error))
      };
    } finally {
      if (connection) {
        try {
          await connection.close();
        } catch (e) {
          console.error('Error closing Oracle connection:', e);
        }
      }
    }
  }

  // SQLite connection testing
  private static async testSqliteConnection(config: any): Promise<DatabaseResponse> {
    const { filename } = config;
    
    let db;
    
    try {
      // Connect to SQLite database
      db = new Database(filename);
      
      // Test connection by getting SQLite version
      const versionRow: any = db.prepare('SELECT sqlite_version() as version').get();
      const version = versionRow?.version || 'Unknown';
      
      // Get table list
      const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'").all();
      const tableNames = tables.map((t: any) => t.name);
      
      // Get schema for each table
      const fieldsByTable: Record<string, any[]> = {};
      
      for (const tableName of tableNames) {
        const columns = db.prepare(`PRAGMA table_info("${tableName}")`).all();
        fieldsByTable[tableName] = columns.map((col: any) => ({
          name: col.name,
          type: col.type,
          selected: ["id", "name", "title", "email", "description"].includes(col.name.toLowerCase())
        }));
      }
      
      return {
        success: true,
        message: 'SQLite connection successful',
        info: {
          filename,
          version
        },
        tables: tableNames,
        fields: fieldsByTable
      };
    } catch (error) {
      return {
        success: false,
        message: `SQLite connection failed: ${error instanceof Error ? error.message : String(error)}`,
        error: error instanceof Error ? error : new Error(String(error))
      };
    } finally {
      if (db) {
        db.close();
      }
    }
  }

  // Execute Query Methods
  
  // PostgreSQL query execution
  private static async queryPostgres(config: any, query: string): Promise<QueryResult> {
    const { 
      connectionString,
      host,
      server = 'localhost',
      port = 5432,
      database,
      user,
      password
    } = config;

    let pool;
    
    try {
      // Use either connection string or individual parameters
      if (connectionString) {
        pool = new PgPool({ connectionString });
      } else {
        pool = new PgPool({
          host: host || server,
          port: parseInt(port.toString()),
          database,
          user,
          password,
          ssl: true
        });
      }

      const client = await pool.connect();
      try {
        const result = await client.query(query);
        return { rows: result.rows, fields: result.fields };
      } finally {
        client.release();
        await pool.end();
      }
    } catch (error) {
      return {
        rows: [],
        error: error instanceof Error ? error : new Error(String(error))
      };
    }
  }
  
  // MySQL query execution
  private static async queryMySql(config: any, query: string): Promise<QueryResult> {
    const { 
      host, 
      server = 'localhost',
      port = 3306, 
      database, 
      user, 
      password 
    } = config;
    
    let connection;
    
    try {
      connection = await mysql.createConnection({
        host: host || server,
        port: parseInt(port.toString()),
        database,
        user,
        password
      });
      
      const [rows, fields] = await connection.execute(query);
      return { rows: rows as any[], fields };
    } catch (error) {
      return {
        rows: [],
        error: error instanceof Error ? error : new Error(String(error))
      };
    } finally {
      if (connection) {
        await connection.end();
      }
    }
  }
  
  // MongoDB query execution
  private static async queryMongoDB(config: any, queryString: string): Promise<QueryResult> {
    const { 
      uri, 
      host = 'localhost', 
      port = 27017, 
      database, 
      username, 
      password,
      collection
    } = config;
    
    let client;
    let connectionString = uri;
    
    // Build connection string if not provided
    if (!connectionString) {
      const authPart = username && password 
        ? `${encodeURIComponent(username)}:${encodeURIComponent(password)}@` 
        : '';
      connectionString = `mongodb://${authPart}${host}:${port}/${database}`;
    }
    
    try {
      client = new MongoClient(connectionString);
      await client.connect();
      
      const db = client.db(database);
      
      // For MongoDB, the query needs to be a JSON string representing a MongoDB query
      // We'll parse it and execute it
      const queryObj = JSON.parse(queryString);
      
      if (!collection) {
        throw new Error('Collection name is required for MongoDB queries');
      }
      
      const result = await db.collection(collection).find(queryObj).toArray();
      return { rows: result };
    } catch (error) {
      return {
        rows: [],
        error: error instanceof Error ? error : new Error(String(error))
      };
    } finally {
      if (client) {
        await client.close();
      }
    }
  }
  
  // SQL Server query execution
  private static async queryMsSql(config: any, query: string): Promise<QueryResult> {
    const { 
      server, 
      port = 1433, 
      database, 
      user, 
      password, 
      trustServerCertificate = true
    } = config;
    
    try {
      // Configure connection
      const sqlConfig: mssql.config = {
        server,
        port: parseInt(port.toString()),
        database,
        user,
        password,
        options: {
          trustServerCertificate,
          encrypt: true
        }
      };
      
      // Connect to SQL Server
      const pool = await mssql.connect(sqlConfig);
      
      const result = await pool.request().query(query);
      await pool.close();
      
      return { rows: result.recordset };
    } catch (error) {
      return {
        rows: [],
        error: error instanceof Error ? error : new Error(String(error))
      };
    }
  }
  
  // Oracle query execution
  private static async queryOracle(config: any, query: string): Promise<QueryResult> {
    const { 
      connectString, 
      host, 
      port = 1521, 
      service, 
      user, 
      password 
    } = config;
    
    let connection;
    let connString = connectString;
    
    // Build connection string if not provided
    if (!connString && host && service) {
      connString = `${host}:${port}/${service}`;
    }
    
    try {
      // Initialize oracledb
      if (typeof oracledb.initOracleClient === 'function') {
        try {
          oracledb.initOracleClient();
        } catch (err) {
          console.log('Oracle client already initialized or not needed in this environment');
        }
      }
      
      // Connect to Oracle
      connection = await oracledb.getConnection({
        connectString: connString,
        user,
        password
      });
      
      const result = await connection.execute(
        query, 
        [], 
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );
      
      return { rows: result.rows as any[] };
    } catch (error) {
      return {
        rows: [],
        error: error instanceof Error ? error : new Error(String(error))
      };
    } finally {
      if (connection) {
        try {
          await connection.close();
        } catch (e) {
          console.error('Error closing Oracle connection:', e);
        }
      }
    }
  }
  
  // SQLite query execution
  private static async querySqlite(config: any, query: string): Promise<QueryResult> {
    const { filename } = config;
    
    let db;
    
    try {
      // Connect to SQLite database
      db = new Database(filename);
      
      let rows: any[];
      
      // Determine if this is a SELECT query or other type
      if (query.trim().toUpperCase().startsWith('SELECT')) {
        rows = db.prepare(query).all();
      } else {
        const stmt = db.prepare(query);
        stmt.run();
        rows = [];
      }
      
      return { rows };
    } catch (error) {
      return {
        rows: [],
        error: error instanceof Error ? error : new Error(String(error))
      };
    } finally {
      if (db) {
        db.close();
      }
    }
  }
}