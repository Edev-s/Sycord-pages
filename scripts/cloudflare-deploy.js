#!/usr/bin/env node

/**
 * Standalone Cloudflare Pages Deployment Script
 *
 * This script deploys static websites to Cloudflare Pages using the Direct Upload API.
 * No Wrangler CLI required!
 *
 * Requirements:
 * - Node.js 14+
 * - Valid Cloudflare API token with Pages:Edit permissions
 * - Cloudflare Account ID
 *
 * Usage:
 *   node cloudflare-deploy.js --account=abc123 --token=xxx --project=my-site --dir=./out
 *   node cloudflare-deploy.js --account=abc123 --token=xxx --project=my-site --use-demo
 *
 * Environment Variables (alternative to CLI args):
 *   CLOUDFLARE_ACCOUNT_ID - Your Cloudflare Account ID
 *   CLOUDFLARE_API_TOKEN - Your Cloudflare API token
 *   CLOUDFLARE_PROJECT_NAME - Your Pages project name
 *   DEPLOY_DIR - Directory containing files to deploy (default: ./out)
 *   USE_DEMO_FILES - Set to 'true' to use Cloudflare demo files instead of local directory
 *
 * How it works:
 * 1. Calculates SHA-256 hashes for all files
 * 2. Creates a deployment with a manifest (path -> hash mapping)
 * 3. Uploads file contents using multipart/form-data (hash as field name)
 */

const fs = require('fs').promises;
const path = require('path');
const https = require('https');
const crypto = require('crypto');
const zlib = require('zlib');

// Local demo zip file path (replaces remote URL to fix white page issue)
const LOCAL_DEMO_ZIP_PATH = path.join(__dirname, '..', 'direct-upload-demo 2.zip');

// Configuration
const config = {
  accountId: process.env.CLOUDFLARE_ACCOUNT_ID || getArg('--account'),
  apiToken: process.env.CLOUDFLARE_API_TOKEN || getArg('--token'),
  projectName: process.env.CLOUDFLARE_PROJECT_NAME || getArg('--project'),
  deployDir: process.env.DEPLOY_DIR || getArg('--dir') || './out',
  branch: process.env.DEPLOY_BRANCH || getArg('--branch') || 'main',
  useDemoFiles: process.env.USE_DEMO_FILES === 'true' || process.argv.includes('--use-demo'),
};

const TEXT_EXTENSIONS = new Set([
  ".html",
  ".htm",
  ".css",
  ".js",
  ".jsx",
  ".ts",
  ".tsx",
  ".json",
  ".txt",
  ".xml",
  ".md",
  ".svg",
  ".yaml",
  ".yml",
  ".toml",
  ".ini",
  ".properties"
]);

const DIRECTORY_INDEX_SUFFIX = "/index.html";
const DIRECTORY_INDEX_SUFFIX_LOWER = DIRECTORY_INDEX_SUFFIX.toLowerCase();
const DIRECTORY_INDEX_SUFFIX_LENGTH = DIRECTORY_INDEX_SUFFIX.length;

const endsWithDirectoryIndex = (pathname) =>
  pathname.toLowerCase().endsWith(DIRECTORY_INDEX_SUFFIX_LOWER);

const stripDirectoryIndex = (pathname) => {
  if (!endsWithDirectoryIndex(pathname)) return pathname;
  const trimmed = pathname.slice(0, -DIRECTORY_INDEX_SUFFIX_LENGTH);
  return trimmed || '/';
};

// Helper to get CLI arguments
function getArg(name) {
  const arg = process.argv.find(a => a.startsWith(name + '='));
  return arg ? arg.split('=')[1] : null;
}

// Helper to make HTTPS requests
function httpsRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const reqOptions = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'Authorization': `Bearer ${config.apiToken}`,
        ...(options.headers || {}),
      },
    };

    console.log(`📊 DEBUG: Making ${reqOptions.method} request to Cloudflare API`);

    const req = https.request(reqOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log(`📊 DEBUG: Response status: ${res.statusCode}`);

        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            const parsed = JSON.parse(data);
            resolve({ status: res.statusCode, data: parsed });
          } catch (e) {
            resolve({ status: res.statusCode, data: data });
          }
        } else {
          console.error(`❌ HTTP ${res.statusCode} Error - ${reqOptions.method} to ${urlObj.pathname}`);
          reject(new Error(`HTTP ${res.statusCode}: ${res.statusText || 'Request failed'}`));
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ Request error:', error.message);
      reject(error);
    });

    if (options.body) {
      const bodyStr = typeof options.body === 'string' ? options.body : JSON.stringify(options.body);
      console.log(`📊 DEBUG: Request body size: ${bodyStr.length} bytes`);
      req.write(bodyStr);
    }

    req.end();
  });
}

// Check if project exists
async function checkProject() {
  console.log(`🔍 Checking if Cloudflare Pages project exists: ${config.projectName}`);
  try {
    await httpsRequest(
      `https://api.cloudflare.com/client/v4/accounts/${config.accountId}/pages/projects/${config.projectName}`
    );
    console.log('✅ Project exists');
    return true;
  } catch (error) {
    console.log('ℹ️  Project does not exist, will create it');
    return false;
  }
}

// Create project
async function createProject() {
  console.log(`📝 Creating Cloudflare Pages project: ${config.projectName}`);

  try {
    await httpsRequest(
      `https://api.cloudflare.com/client/v4/accounts/${config.accountId}/pages/projects`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: {
          name: config.projectName,
          production_branch: config.branch,
        },
      }
    );
    console.log('✅ Project created');
    return true;
  } catch (error) {
    console.error('❌ Failed to create project:', error.message);
    return false;
  }
}

// Read all files from directory recursively
async function readDirectory(dir, baseDir = dir) {
  const files = [];
  const items = await fs.readdir(dir, { withFileTypes: true });

  for (const item of items) {
    const fullPath = path.join(dir, item.name);

    if (item.isDirectory()) {
      files.push(...await readDirectory(fullPath, baseDir));
    } else if (item.isFile()) {
      try {
        const ext = path.extname(fullPath).toLowerCase();
        const isTextFile = TEXT_EXTENSIONS.has(ext);
        const content = isTextFile
          ? await fs.readFile(fullPath, 'utf-8')
          : await fs.readFile(fullPath);
        const relativePath = '/' + path.relative(baseDir, fullPath).replace(/\\/g, '/');

        // Validate file size (25MB limit per file for Cloudflare)
        const sizeInMB = (isTextFile ? Buffer.byteLength(content, 'utf-8') : content.length) / 1024 / 1024;
        if (sizeInMB > 25) {
          console.warn(`⚠️  Warning: ${relativePath} is ${sizeInMB.toFixed(2)}MB (limit: 25MB), skipping...`);
          continue;
        }

        files.push({ path: relativePath, content });
      } catch (error) {
        console.warn(`⚠️  Warning: Failed to read ${fullPath}: ${error.message}`);
      }
    }
  }

  return files;
}

// Helper function to find the end of compressed data by scanning for next header
// Used when the zip uses data descriptors (bit 3 of general purpose flag)
function findCompressedDataEnd(buffer, dataStart) {
  let scanOffset = dataStart;
  while (scanOffset < buffer.length - 4) {
    const sig = buffer.readUInt32LE(scanOffset);
    // Data descriptor signature (optional) or next local file header or central directory
    if (sig === 0x08074b50 || sig === 0x04034b50 || sig === 0x02014b50) {
      return scanOffset;
    }
    scanOffset++;
  }
  return buffer.length;
}

// Helper to parse ZIP file entries (minimal implementation for static files)
// Supports uncompressed (STORED) and DEFLATE compressed files
// Also supports data descriptors (bit 3 of general purpose flag)
async function parseZipEntries(zipBuffer) {
  const files = [];
  let offset = 0;
  
  while (offset < zipBuffer.length - 4) {
    // Look for local file header signature (0x04034b50)
    const signature = zipBuffer.readUInt32LE(offset);
    if (signature !== 0x04034b50) {
      break; // End of local file headers
    }
    
    const generalFlag = zipBuffer.readUInt16LE(offset + 6);
    const hasDataDescriptor = (generalFlag & 0x08) !== 0; // Bit 3 set
    const compressionMethod = zipBuffer.readUInt16LE(offset + 8);
    let compressedSize = zipBuffer.readUInt32LE(offset + 18);
    const fileNameLength = zipBuffer.readUInt16LE(offset + 26);
    const extraFieldLength = zipBuffer.readUInt16LE(offset + 28);
    
    const fileNameStart = offset + 30;
    const fileName = zipBuffer.toString('utf-8', fileNameStart, fileNameStart + fileNameLength);
    const dataStart = fileNameStart + fileNameLength + extraFieldLength;
    
    // If using data descriptor and compressedSize is 0, we need to scan for the end
    let dataEnd;
    if (hasDataDescriptor && compressedSize === 0) {
      dataEnd = findCompressedDataEnd(zipBuffer, dataStart);
      compressedSize = dataEnd - dataStart;
    } else {
      dataEnd = dataStart + compressedSize;
    }
    
    // Skip directories (they end with /)
    if (!fileName.endsWith('/') && compressedSize > 0) {
      const compressedData = zipBuffer.subarray(dataStart, dataEnd);
      let content;
      
      if (compressionMethod === 0) {
        // STORED (no compression)
        content = compressedData.toString('utf-8');
      } else if (compressionMethod === 8) {
        // DEFLATE compression
        try {
          const inflated = await new Promise((resolve, reject) => {
            const inflater = zlib.createInflateRaw();
            const chunks = [];
            inflater.on('data', (chunk) => chunks.push(chunk));
            inflater.on('end', () => resolve(Buffer.concat(chunks)));
            inflater.on('error', reject);
            inflater.end(compressedData);
          });
          content = inflated.toString('utf-8');
        } catch (error) {
          // If decompression fails, skip this file
          console.warn(`⚠️  Decompression failed for file ${fileName}:`, error?.message || error);
          offset = dataEnd;
          if (hasDataDescriptor) offset += 12;
          continue;
        }
      } else {
        // Unsupported compression method, skip
        offset = dataEnd;
        if (hasDataDescriptor) offset += 12;
        continue;
      }
      
      // Normalize path to start with /
      const normalizedPath = fileName.startsWith('/') ? fileName : `/${fileName}`;
      files.push({ path: normalizedPath, content });
    }
    
    // Move to next entry
    offset = dataEnd;
    if (hasDataDescriptor) {
      // Check for data descriptor signature (optional)
      if (offset < zipBuffer.length - 4 && zipBuffer.readUInt32LE(offset) === 0x08074b50) {
        offset += 16; // signature + crc + compressedSize + uncompressedSize
      } else if (offset < zipBuffer.length - 12) {
        offset += 12; // crc + compressedSize + uncompressedSize (no signature)
      }
    }
  }
  
  return files;
}

// Read and extract demo files from the local zip file
// This replaces the remote URL fetch to fix the white page issue after direct upload
async function fetchDemoFiles() {
  console.log(`📥 Reading demo files from local zip: ${LOCAL_DEMO_ZIP_PATH}...`);
  
  let zipBuffer;
  try {
    zipBuffer = await fs.readFile(LOCAL_DEMO_ZIP_PATH);
  } catch (error) {
    const errorMsg = error?.code === 'ENOENT'
      ? `Local demo zip file not found: ${LOCAL_DEMO_ZIP_PATH}`
      : `Failed to read local demo zip file: ${error?.message}`;
    throw new Error(errorMsg);
  }
  
  console.log(`📥 Read local demo zip (${zipBuffer.length} bytes)`);
  
  const files = await parseZipEntries(zipBuffer);
  console.log(`✅ Extracted ${files.length} files from demo zip`);
  
  for (const file of files) {
    console.log(`   📄 ${file.path} (${file.content.length} bytes)`);
  }
  
  return files;
}

// Deploy to Cloudflare Pages
// This uses the single-request approach where manifest and files are sent together
async function deployToCloudflare(files) {
  console.log(`🚀 Starting deployment to Cloudflare Pages...`);
  console.log(`📊 DEBUG: Deploying ${files.length} files`);
  console.log(
    `📊 DEBUG: Total size: ${
      files.reduce(
        (sum, f) => sum + (Buffer.isBuffer(f.content) ? f.content.length : Buffer.byteLength(f.content, 'utf-8')),
        0
      )
    } bytes`
  );

  // Calculate file hashes (SHA-256) and prepare file contents as Buffers
  const fileHashes = {};
  const fileContents = {};

  for (const file of files) {
    // Use Buffer for consistent hashing and binary safety
    const contentBuffer = Buffer.isBuffer(file.content)
      ? file.content
      : Buffer.from(file.content, 'utf-8');
    const hash = crypto.createHash('sha256').update(contentBuffer).digest('hex');

    // Check for hash collision (extremely unlikely but worth validating)
    if (fileContents[hash] && !fileContents[hash].equals(contentBuffer)) {
      throw new Error(`Hash collision detected for ${file.path}. This is extremely rare - please report this issue.`);
    }

    fileHashes[file.path] = hash;
    fileContents[hash] = contentBuffer;
    if (endsWithDirectoryIndex(file.path)) {
      const basePath = stripDirectoryIndex(file.path);
      fileHashes[basePath] = hash;
      if (basePath !== '/' && !basePath.endsWith('/')) {
        fileHashes[`${basePath}/`] = hash;
      }
    }
    console.log(`   📄 ${file.path} (${(contentBuffer.length / 1024).toFixed(2)} KB, SHA-256: ${hash.substring(0, 12)}...)`);
  }

  console.log(`📊 DEBUG: Total files in manifest: ${Object.keys(fileHashes).length}`);

  // Create deployment with manifest AND files using multipart/form-data
  // Cloudflare Pages Direct Upload API accepts both in a single request
  console.log('📝 Creating deployment with manifest and uploading files...');
  const stage = config.branch === 'main' ? 'production' : 'preview';
  console.log(`📊 DEBUG: Branch: ${config.branch}`);
  console.log(`📊 DEBUG: Stage: ${stage}`);

  const boundary = '----CloudflareDeployBoundary' + Date.now();
  const manifestJson = JSON.stringify(fileHashes);
  
  // Build multipart form data using Buffer for binary safety
  const parts = [];
  
  // Add manifest field
  parts.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="manifest"\r\nContent-Type: application/json\r\n\r\n`, 'utf-8'));
  parts.push(Buffer.from(manifestJson, 'utf-8'));
  parts.push(Buffer.from('\r\n', 'utf-8'));
  
  // Add each file with its hash as the field name
  for (const [hash, contentBuffer] of Object.entries(fileContents)) {
    parts.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="${hash}"\r\nContent-Type: application/octet-stream\r\n\r\n`, 'utf-8'));
    parts.push(contentBuffer);
    parts.push(Buffer.from('\r\n', 'utf-8'));
  }
  
  // Add _routes.json to serve all routes as static assets
  // This prevents Cloudflare from treating the deployment as Functions unintentionally
  // which can cause 500 errors on the deployed site
  const routesJson = JSON.stringify({
    version: 1,
    include: ["/*"],
    exclude: []
  });
  parts.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="_routes.json"; filename="_routes.json"\r\nContent-Type: application/json\r\n\r\n`, 'utf-8'));
  parts.push(Buffer.from(routesJson, 'utf-8'));
  parts.push(Buffer.from('\r\n', 'utf-8'));
  console.log('📊 DEBUG: Added _routes.json to serve all routes as static assets');
  
  parts.push(Buffer.from(`--${boundary}--\r\n`, 'utf-8'));
  
  // Concatenate all parts into a single Buffer
  const formDataBuffer = Buffer.concat(parts);

  console.log(`📊 DEBUG: Total form data size: ${formDataBuffer.length} bytes`);

  const deployUrl = new URL(`https://api.cloudflare.com/client/v4/accounts/${config.accountId}/pages/projects/${config.projectName}/deployments`);
  deployUrl.searchParams.set('branch', encodeURIComponent(config.branch));
  deployUrl.searchParams.set('stage', encodeURIComponent(stage));
  const deployOptions = {
    hostname: deployUrl.hostname,
    path: deployUrl.pathname + deployUrl.search,
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.apiToken}`,
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
      'Content-Length': formDataBuffer.length,
    },
  };

  console.log(`📊 DEBUG: Making POST request to Cloudflare API`);

  const deployResponse = await new Promise((resolve, reject) => {
    const req = https.request(deployOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log(`📊 DEBUG: Deploy response status: ${res.statusCode}`);
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            const parsed = JSON.parse(data);
            resolve({ status: res.statusCode, data: parsed });
          } catch (e) {
            resolve({ status: res.statusCode, data: data });
          }
        } else {
          console.error(`❌ HTTP ${res.statusCode} Error - Response: ${data}`);
          reject(new Error(`HTTP ${res.statusCode}: ${res.statusText || 'Request failed'}`));
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ Request error:', error.message);
      reject(error);
    });

    // Write the Buffer directly for binary safety
    req.write(formDataBuffer);
    req.end();
  });

  const deploymentId = deployResponse.data.result?.id;
  const deploymentUrl = deployResponse.data.result?.url;

  if (!deploymentId) {
    console.error('❌ ERROR: No deployment ID in response. Response:', JSON.stringify(deployResponse.data, null, 2));
    throw new Error('No deployment ID received from Cloudflare. Deployment may have failed.');
  }

  console.log(`✅ Deployment successful (ID: ${deploymentId})`);

  return {
    url: deploymentUrl || `https://${config.projectName}.pages.dev`,
    deploymentId,
  };
}

// Main deployment function
async function deploy() {
  console.log('\n☁️  Cloudflare Pages Deployment Tool\n');

  // Validate configuration
  console.log('\n🔧 Configuration:');
  console.log(`   Account ID: ${config.accountId ? 'configured' : 'NOT SET'}`);
  console.log(`   API Token: ${config.apiToken ? 'configured' : 'NOT SET'}`);
  console.log(`   Project Name: ${config.projectName || 'NOT SET'}`);
  console.log(`   Deploy Dir: ${config.useDemoFiles ? '(using demo files)' : config.deployDir}`);
  console.log(`   Branch: ${config.branch}`);
  console.log(`   Use Demo Files: ${config.useDemoFiles ? 'YES' : 'NO'}`);
  console.log('');

  if (!config.accountId) {
    console.error('❌ Error: Cloudflare Account ID is required');
    console.error('Provide via --account=xxx or CLOUDFLARE_ACCOUNT_ID env var');
    console.error('\nFind your Account ID at: https://dash.cloudflare.com/');
    process.exit(1);
  }

  if (!config.apiToken) {
    console.error('❌ Error: Cloudflare API token is required');
    console.error('Provide via --token=xxx or CLOUDFLARE_API_TOKEN env var');
    console.error('\nCreate a token at: https://dash.cloudflare.com/profile/api-tokens');
    console.error('Required permission: Account → Cloudflare Pages → Edit');
    process.exit(1);
  }

  if (!config.projectName) {
    console.error('❌ Error: Project name is required');
    console.error('Provide via --project=my-site or CLOUDFLARE_PROJECT_NAME env var');
    process.exit(1);
  }

  try {
    // Step 1: Check/create project
    const projectExists = await checkProject();
    if (!projectExists) {
      const created = await createProject();
      if (!created) {
        process.exit(1);
      }
    }

    // Step 2: Read files (either from demo zip or local directory)
    let files;
    if (config.useDemoFiles) {
      console.log('\n📥 Using Cloudflare demo files...');
      files = await fetchDemoFiles();
    } else {
      console.log(`\n📂 Reading files from: ${config.deployDir}`);
      files = await readDirectory(config.deployDir);
    }
    console.log(`✅ Found ${files.length} file(s)`);

    if (files.length === 0) {
      console.error('❌ Error: No files found to deploy');
      process.exit(1);
    }

    // Step 3: Deploy
    const { url, deploymentId } = await deployToCloudflare(files);

    // Success!
    console.log('\n🎉 Deployment successful!');
    console.log(`\n🌐 Your site is live at: ${url}`);
    console.log(`📋 Deployment ID: ${deploymentId}\n`);

  } catch (error) {
    console.error('\n❌ Deployment failed:', error.message);
    process.exit(1);
  }
}

// Run deployment
if (require.main === module) {
  deploy();
}

module.exports = { deploy };
