import dotenv from 'dotenv';
dotenv.config();

console.log('=== VERIFYING ENVIRONMENT CREDENTIALS ===\n');

// 1. Port
console.log('[1] PORT:', process.env.PORT || 'Not set (defaults to 5173)');

// 2. SESSION_SECRET
const sessionSecret = process.env.SESSION_SECRET;
if (sessionSecret && sessionSecret.length >= 16) {
  console.log('[2] SESSION_SECRET: OK (length:', sessionSecret.length, 'chars)');
} else {
  console.error('[2] SESSION_SECRET: WARNING - Missing or too short');
}

// 3. Google Client ID & Secret
const googleClientId = process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;
console.log('\n[3] GOOGLE OAUTH CREDENTIALS:');
console.log('  Client ID:', googleClientId ? `${googleClientId.slice(0, 20)}...` : 'MISSING');
console.log('  Client Secret:', googleClientSecret ? `${googleClientSecret.slice(0, 8)}...` : 'MISSING');

async function testGoogle() {
  try {
    // Check Google OpenID Discovery
    const discoveryRes = await fetch('https://accounts.google.com/.well-known/openid-configuration');
    const discovery = await discoveryRes.json();
    if (discovery.issuer === 'https://accounts.google.com') {
      console.log('  Google OAuth Service: Reachable (Issuer:', discovery.issuer + ')');
    }
  } catch (err) {
    console.error('  Google OAuth Service Error:', err.message);
  }
}

// 4. Cloudflare D1 Credentials
const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
const databaseId = process.env.CLOUDFLARE_DATABASE_ID;
const apiToken = process.env.CLOUDFLARE_API_TOKEN;

console.log('\n[4] CLOUDFLARE D1 CREDENTIALS:');
console.log('  Account ID:', accountId || 'MISSING');
console.log('  Database ID:', databaseId || 'MISSING');
console.log('  API Token:', apiToken ? `${apiToken.slice(0, 10)}... (length: ${apiToken.length})` : 'MISSING');

async function testCloudflare() {
  // A. Verify API Token
  try {
    const tokenRes = await fetch('https://api.cloudflare.com/client/v4/user/tokens/verify', {
      headers: { Authorization: `Bearer ${apiToken?.trim()}` }
    });
    const tokenJson = await tokenRes.json();
    console.log('  Token Verification:', tokenJson.success ? 'ACTIVE & VALID' : 'FAILED');
    if (!tokenJson.success) {
      console.log('  Token Errors:', JSON.stringify(tokenJson.errors));
    } else {
      console.log('  Token Status:', tokenJson.result?.status);
    }
  } catch (err) {
    console.error('  Token Check Error:', err.message);
  }

  // B. Check D1 Database Access
  try {
    const d1Endpoint = `https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${databaseId}/query`;
    const d1Res = await fetch(d1Endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiToken?.trim()}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ sql: 'SELECT 1 as test', params: [] })
    });
    const d1Json = await d1Res.json();
    if (d1Json.success) {
      console.log('  D1 Database Query: SUCCESS (Connected to database', databaseId + ')');
    } else {
      console.log('  D1 Database Query: FAILED');
      console.log('  D1 Errors:', JSON.stringify(d1Json.errors));
    }
  } catch (err) {
    console.error('  D1 Query Error:', err.message);
  }
}

async function run() {
  await testGoogle();
  await testCloudflare();
  console.log('\n=== VERIFICATION COMPLETE ===');
}

run();
