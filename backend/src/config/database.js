const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME || 'cartsaver_db',
  process.env.DB_USER || 'postgres',
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: parseInt(process.env.DB_POOL_MAX) || 10, // Increased from 5
      min: parseInt(process.env.DB_POOL_MIN) || 2,  // Increased from 0 for better performance
      acquire: 30000,
      idle: 10000,
      evict: 1000 // Check for idle connections every second
    },
    define: {
      timestamps: true,
      underscored: true,
      freezeTableName: true
    },
    // Performance optimizations
    benchmark: process.env.NODE_ENV === 'development',
    dialectOptions: {
      // Enable TCP keep-alive
      keepAlive: true,
      statement_timeout: 30000, // 30 second query timeout
      idle_in_transaction_session_timeout: 60000 // 60 second transaction timeout
    },
    // Query optimizations
    retry: {
      max: 3,
      timeout: 3000
    }
  }
);

module.exports = { sequelize };
