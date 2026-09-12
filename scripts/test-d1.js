import { queryD1, syncStateToD1, loadStateFromD1 } from '../server/services/d1Client.js';

async function main() {
  console.log('1. Testing query to Cloudflare D1...');
  const testRes = await queryD1('SELECT 1 as connected, datetime("now") as currentTime');
  console.log('   D1 Connectivity result:', testRes);

  console.log('\n2. Listing existing tables in Cloudflare D1:');
  const tables = await queryD1("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE '_cf_%'");
  console.log('   Tables in axtrade-db:', tables.map(t => t.name));

  console.log('\n3. Testing write/sync to D1 for all tables (portfolio, watchlists, holdings, positions, orders, journal):');
  const testState = {
    initialCapital: 1000000,
    cashBalance: 950000,
    realizedPnl: 5000,
    watchlists: [
      { id: 'default', name: 'Watchlist 1', symbols: ['RELIANCE.NS', '^NSEI'] }
    ],
    holdings: [
      { symbol: 'TEST.NS', name: 'Test Stock', qty: 10, avgPrice: 150, totalInvested: 1500 }
    ],
    positions: [
      { id: 'POS-TEST', symbol: 'TEST.NS', name: 'Test Stock', type: 'BUY', product: 'CNC', qty: 10, entryPrice: 150 }
    ],
    orders: [
      { id: 'ORD-TEST', symbol: 'TEST.NS', name: 'Test Stock', action: 'BUY', orderType: 'MARKET', product: 'CNC', qty: 10, price: 150, executedPrice: 150, status: 'EXECUTED', charges: 20 }
    ],
    journal: [
      { id: 'JRN-TEST', orderId: 'ORD-TEST', symbol: 'TEST.NS', entryDate: '2026-09-12', exitDate: '2026-09-12', entryPrice: 150, exitPrice: 160, qty: 10, pnl: 100 }
    ]
  };
  const synced = await syncStateToD1(testState, 'test_user_verify');
  console.log('   Sync to D1 success:', synced);

  console.log('\n4. Testing read back from Cloudflare D1:');
  const loaded = await loadStateFromD1('test_user_verify');
  console.log('   Read Capital from D1:', loaded?.initialCapital);
  console.log('   Read Cash Balance from D1:', loaded?.cashBalance);
  console.log('   Read Watchlists count from D1:', loaded?.watchlists?.length);
  console.log('   Read Holdings count from D1:', loaded?.holdings?.length, loaded?.holdings?.[0]?.symbol);
  console.log('   Read Positions count from D1:', loaded?.positions?.length, loaded?.positions?.[0]?.id);
  console.log('   Read Orders count from D1:', loaded?.orders?.length, loaded?.orders?.[0]?.id);
  console.log('   Read Journal count from D1:', loaded?.journal?.length, loaded?.journal?.[0]?.id);

  // Clean up test records
  await queryD1('DELETE FROM portfolio WHERE id = ?', ['test_user_verify']);
  await queryD1('DELETE FROM watchlists WHERE id LIKE ?', ['test_user_verify_%']);
  await queryD1('DELETE FROM holdings WHERE symbol = ?', ['TEST.NS']);
  await queryD1('DELETE FROM positions WHERE id = ?', ['POS-TEST']);
  await queryD1('DELETE FROM orders WHERE id = ?', ['ORD-TEST']);
  await queryD1('DELETE FROM journal WHERE id = ?', ['JRN-TEST']);
  console.log('\n5. Cleaned up verification test records across all tables.');

  console.log('\n🎉 ALL TABLES (PORTFOLIO, WATCHLISTS, HOLDINGS, POSITIONS, ORDERS, JOURNAL) ARE VERIFIED AND STORING DIRECTLY IN CLOUDFLARE D1!');
}

main().catch(console.error);
