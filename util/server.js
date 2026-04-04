import dotenv from 'dotenv';
dotenv.config();

import * as http from 'http';
import * as fs from 'fs';
import * as path from 'path';
import { listSpacesObjects } from './spaces-list.js'; // Use the correct relative path

let baseDirectory = '.';
let port = process.env.PORT || 8080;  // Use PORT env variable if available (for DigitalOcean, Heroku, etc.)
let host = '0.0.0.0';
let lasttRequesTime = performance.now() / 1000;
for (let i = 0; i < process.argv.length; ++i) {
  if (process.argv[i] == '-d' && i < process.argv.length - 1) {
    baseDirectory = process.argv[i + 1];
  }
  if (process.argv[i] == '-p' && i < process.argv.length - 1) {
    port = process.argv[i + 1];
  }
  if (process.argv[i] == '-h' && i < process.argv.length - 1) {
    host = process.argv[i + 1];
  }
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

http
  .createServer( async function(request, response) {

    response.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    response.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');

    let filePath = baseDirectory + request.url;

    const extname = path.extname(filePath);
    let contentType = 'text/html';
    switch (extname) {
      case '.js':
        contentType = 'text/javascript';
        break;
      case '.css':
        contentType = 'text/css';
        break;
      case '.json':
        contentType = 'application/json';
        break;
      case '.png':
        contentType = 'image/png';
        break;
      case '.jpg':
        contentType = 'image/jpg';
        break;
    }

    const requestTime = performance.now() / 1000;
    if (requestTime - lasttRequesTime > 1) {
      console.log('');
      console.log('-----------------------------------------------');
    }

    let queryString;
    let queryStringStart = filePath.indexOf('?');
    if (queryStringStart && queryStringStart > 0) {
      queryString = filePath.substring(queryStringStart + 1);
      filePath = filePath.substring(0, queryStringStart);
    }

    if (request.url === '/list') {
      listSpacesObjects((err, data) => {
        if (err) {
          console.error('Error occurred:', err);
          response.writeHead(500, { 'Content-Type': 'application/json' });
          response.end(JSON.stringify({ error: err.message }));
          return;
        }
        response.writeHead(200, { 'Content-Type': 'application/json' });
        response.end(JSON.stringify(data));
      });
      return;
    }

    // Handle .well-known paths (Chrome DevTools auto-discovery)
    if (request.url.includes('/.well-known/')) {
      response.writeHead(204, { 'Content-Type': 'application/json' });
      response.end();
      return;
    }

    // Handle source map requests by proxying to Spark CDN or GitHub raw
    if (filePath.endsWith('.js.map')) {
      const mapFileName = path.basename(filePath);

      // Try Spark CDN first, then fall back to GitHub raw for development builds
      const cdnUrls = [
        `https://sparkjs.dev/releases/spark/preview/2.0.0/${mapFileName}`,
        `https://raw.githubusercontent.com/sparkjsdev/spark/main/dist/${mapFileName}`
      ];

      console.log(`Proxying source map request for: ${mapFileName}`);

      const https = await import('https');

      const tryUrl = async (urlIndex) => {
        if (urlIndex >= cdnUrls.length) {
          // All URLs failed, return 204
          console.log(`All source map URLs failed, returning 204`);
          response.writeHead(204);
          response.end();
          return;
        }

        const cdnUrl = cdnUrls[urlIndex];
        console.log(`  Trying: ${cdnUrl}`);

        https.get(cdnUrl, (cdnResponse) => {
          if (cdnResponse.statusCode === 200) {
            response.writeHead(200, { 'Content-Type': 'application/json' });
            cdnResponse.pipe(response);
          } else {
            console.log(`  Failed (${cdnResponse.statusCode}), trying next URL...`);
            tryUrl(urlIndex + 1);
          }
        }).on('error', (err) => {
          console.log(`  Error: ${err.message}, trying next URL...`);
          tryUrl(urlIndex + 1);
        });
      };

      await tryUrl(0);
      return;
    }

    let testDirectory = filePath;
    if (testDirectory.endsWith('/')) {
      testDirectory = testDirectory.substring(0, testDirectory.length - 1);
    }
    try {
      if (fs.lstatSync(filePath).isDirectory()) {
        let testDirectory = filePath;
        if (!testDirectory.endsWith('/')) testDirectory = testDirectory + '/';
        if (fs.existsSync(testDirectory + 'index.html')) {
          filePath = testDirectory + 'index.html';
        } else if (fs.existsSync(testDirectory + 'index.htm')) {
          filePath = testDirectory + 'index.htm';
        }
      }
    } catch (err) {
      // ignore
    }

    try {
      const stats = fs.statSync(filePath);
      if (stats && stats.size) {
        const fileSizeInBytes = stats.size;
        response.setHeader('Content-Length', fileSizeInBytes);
      }
    } catch (err) {
      // ignore
    }

    fs.readFile(filePath, async function(error, content) {
      if (error) {
        if (error.code == 'ENOENT') {
          console.log('HTTP(404) Request for ' + filePath + ' -> File not found.');
        } else {
          console.log('HTTP(500)) Request for ' + filePath + ' -> Server error.');
          response.writeHead(500);
          response.end(
            'Sorry, check with the site admin for error: ' +
              error.code +
              ' ..\n'
          );
          response.end();
        }
      } else {
        console.log('HTTP(200) Request for ' + filePath);
        response.writeHead(200, { 'Content-Type': contentType });
        response.end(content, 'utf-8');
      }
    });

    lasttRequesTime = requestTime;
  })
  .listen(port, host);
console.log('Server running at ' + host + ':' + port);
