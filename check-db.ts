import dotenv from "dotenv";
import pg from "pg";

dotenv.config({ path: ".env.local" });

async function main() {
  const client = new pg.Client({
    connectionString: process.env.DATABASE_URL,
  });

  await client.connect();

  const result = await client.query(`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
    ORDER BY table_name
  `);

  console.log("Tables in app_db:");
  console.table(result.rows);

  await client.end();
}

main().catch(console.error);