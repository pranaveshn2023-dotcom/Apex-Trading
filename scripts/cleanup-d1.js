import { queryD1 } from '../server/services/d1Client.js';

async function cleanup() {
  console.log('Cleaning unwanted/dummy rows from Cloudflare D1...');
  
  await queryD1("DELETE FROM portfolio WHERE id != 'user_7072616e61766573'");
  await queryD1("DELETE FROM watchlists WHERE id != 'wl_user_7072616e61766573'");
  await queryD1("DELETE FROM users WHERE email != 'pranaveshnandakumar@gmail.com'");
  await queryD1("DELETE FROM sessions WHERE user_id != 'user_7072616e61766573'");
  await queryD1("DELETE FROM orders");
  await queryD1("DELETE FROM positions");
  await queryD1("DELETE FROM holdings");
  await queryD1("DELETE FROM journal");

  console.log('--- D1 Clean State ---');
  const portfolios = await queryD1('SELECT * FROM portfolio');
  console.log('Portfolios:', portfolios);

  const watchlists = await queryD1('SELECT * FROM watchlists');
  console.log('Watchlists:', watchlists);

  const users = await queryD1('SELECT * FROM users');
  console.log('Users:', users);
  
  const sessions = await queryD1('SELECT count(*) as count FROM sessions');
  console.log('Active Sessions:', sessions);
}

cleanup().catch(err => console.error('Cleanup error:', err));
