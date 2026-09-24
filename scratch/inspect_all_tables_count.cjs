const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:1234@localhost:5432/qtech_linebalancing'
});

async function run() {
  await client.connect();
  const res = await client.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    ORDER BY table_name;
  `);
  console.log('=== ALL TABLES & ROW COUNTS ===');
  for (const row of res.rows) {
    try {
      const countRes = await client.query(`SELECT count(*) FROM "${row.table_name}"`);
      console.log(`${row.table_name}: ${countRes.rows[0].count} rows`);
    } catch (e) {
      console.log(`${row.table_name}: error ${e.message}`);
    }
  }
  await client.end();
}

run().catch(console.error);
