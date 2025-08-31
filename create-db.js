const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function createDatabase() {
  // Se connecter à postgres (base par défaut)
  const client = new Client({
    host: '127.0.0.1',
    port: 5432,
    user: 'postgres',
    password: 'mangue',
    database: 'postgres' // Base par défaut
  });

  try {
    await client.connect();
    console.log('✅ Connecté à PostgreSQL');

    // Créer la base si elle n'existe pas
    const result = await client.query("SELECT 1 FROM pg_database WHERE datname = 'romai_mvp'");
    
    if (result.rows.length === 0) {
      await client.query('CREATE DATABASE romai_mvp');
      console.log('✅ Base de données romai_mvp créée');
    } else {
      console.log('ℹ️  Base de données romai_mvp existe déjà');
    }

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await client.end();
  }
}

createDatabase();