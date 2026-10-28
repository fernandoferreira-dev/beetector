const mariadb = require('mariadb');

// Cria o pool de conexões usando as variáveis passadas pelo Docker Compose
const pool = mariadb.createPool({
    host: process.env.DB_HOST,         // Lê 'host.docker.internal' do Compose/env
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    connectionLimit: 5
});

// Exporta o pool com suporte para async/await
module.exports = {
    getConnection: () => pool.getConnection(),
    query: (sql, params) => pool.query(sql, params)
};