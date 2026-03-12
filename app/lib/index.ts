// app/lib/index.ts

// Export from database-wrapper.js (abstraction layer) - THIS has initializeDatabase
export { 
  initializeDatabase,
  query,
  queryOne,
  getSQL,
  default as db
} from './database-wrapper';  // Change from database-schema to database-wrapper

// Export from database-schema.ts (schema) with alias
export { initDatabase as initSchema, default as schemaDb } from './database-schema';