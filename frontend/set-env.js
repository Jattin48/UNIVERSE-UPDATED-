const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, 'src', 'environments', 'environment.prod.ts');
let apiUrl = process.env.API_URL || 'https://YOUR-RENDER-BACKEND-URL.onrender.com/api';

// Remove trailing slash if present
apiUrl = apiUrl.replace(/\/+$/, '');

// Ensure /api suffix
if (!apiUrl.endsWith('/api')) {
  apiUrl += '/api';
}

const envConfigFile = `export const environment = {
  production: true,
  apiUrl: '${apiUrl}'
};
`;

fs.writeFileSync(targetPath, envConfigFile);
console.log(`[set-env] Generated environment.prod.ts with apiUrl: ${apiUrl}`);
