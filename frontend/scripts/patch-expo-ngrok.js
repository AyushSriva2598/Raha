#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const targetPath = path.resolve(__dirname, '../../node_modules/@expo/cli/build/src/start/server/AsyncNgrok.js');

if (!fs.existsSync(targetPath)) {
  process.exit(0);
}

let content = fs.readFileSync(targetPath, 'utf8');

let modified = false;

// 1. Support NGROK_AUTHTOKEN in NGROK_CONFIG
if (!content.includes('process.env.NGROK_AUTHTOKEN')) {
  content = content.replace(
    "authToken: '5W1bR67GNbWcXqmxZzBG1_56GezNeaX6sSRvn8npeQ8',",
    "authToken: process.env.NGROK_AUTHTOKEN || '5W1bR67GNbWcXqmxZzBG1_56GezNeaX6sSRvn8npeQ8',"
  );
  modified = true;
}

// 2. Bypass exp.direct custom hostname when personal NGROK_AUTHTOKEN is provided
if (!content.includes('if (process.env.NGROK_AUTHTOKEN) {\n            return {};\n        }')) {
  content = content.replace(
    'async _getConnectionPropsAsync() {',
    'async _getConnectionPropsAsync() {\n        if (process.env.NGROK_AUTHTOKEN) {\n            return {};\n        }'
  );
  modified = true;
}

// 3. Pass custom token to connect
if (!content.includes('const token = process.env.NGROK_AUTHTOKEN || NGROK_CONFIG.authToken;')) {
  content = content.replace(
    'authtoken: NGROK_CONFIG.authToken,',
    'authtoken: process.env.NGROK_AUTHTOKEN || NGROK_CONFIG.authToken,'
  );
  modified = true;
}

if (modified) {
  fs.writeFileSync(targetPath, content, 'utf8');
  console.log('[Raha] Applied @expo/cli patch for custom Ngrok authtoken support.');
}
