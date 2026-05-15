const fs = require('fs');
const path = require('path');

const apiUrl = process.env.API_URL || 'http://localhost:8080';
const razorpayKeyId = process.env.RAZORPAY_KEY_ID || '';

const content = `export const environment = {
  production: true,
  apiUrl: '${apiUrl.replace(/'/g, "\\'")}',
  razorpayKeyId: '${razorpayKeyId.replace(/'/g, "\\'")}'
};
`;

const target = path.join(__dirname, '..', 'src', 'environments', 'environment.prod.ts');
fs.writeFileSync(target, content, 'utf8');
console.log(`Wrote ${target} (apiUrl=${apiUrl})`);
