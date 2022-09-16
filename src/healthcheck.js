/* eslint-disable no-console */
const http = require('http');

const args = process.argv.slice(2);
let port = '3000';
args.forEach(arg => {
  const [argName, argValue] = arg.split('=');
  if (argName === '--port') {
    port = argValue;
  }
});

const options = {
  host: 'localhost',
  port: port,
  path: '/healthcheck',
  timeout: 2000
};

const request = http.request(options, res => {
  console.log(`STATUS: ${res.statusCode}`);
  if (res.statusCode === 200) {
    process.exit(0);
  } else {
    process.exit(1);
  }
});

request.on('error', err => {
  console.log('ERROR', err);
  process.exit(1);
});

request.end();
