import https from 'https';
import crypto from 'crypto';

// Constructed from the DigitalOcean Spaces API documentation
// https://docs.digitalocean.com/reference/api/spaces-api/#list-a-buckets-contents

function sign(key, msg) {
  return crypto.createHmac('sha256', key).update(msg, 'utf8').digest();
}

function getSignatureKey(key, dateStamp, regionName, serviceName) {
  const kDate = sign(`AWS4${key}`, dateStamp);
  const kRegion = sign(kDate, regionName);
  const kService = sign(kRegion, serviceName);
  const kSigning = sign(kService, 'aws4_request');
  return kSigning;
}

function constructRequest() {
  const bucket = process.env.SPACES_BUCKET;
  const accessKeyId = process.env.SPACES_ID;
  const secretAccessKey = process.env.SPACES_SECRET;
  const region = 'nyc3';
  const host = `${bucket}.${region}.digitaloceanspaces.com`;

  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
  const dateStamp = amzDate.slice(0, 8);
  const canonicalQuerystring = '';
  const canonicalHeaders =
    `host:${host}\nx-amz-content-sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855\nx-amz-date:${amzDate}\n`;
  const signedHeaders = 'host;x-amz-content-sha256;x-amz-date';
  const payloadHash = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';

  const canonicalRequest = `GET\n/\n${canonicalQuerystring}\n${canonicalHeaders}\n${signedHeaders}\n${payloadHash}`;

  const algorithm = 'AWS4-HMAC-SHA256';
  const credentialScope = `${dateStamp}/${region}/s3/aws4_request`;
  const stringToSign =
    `${algorithm}\n${amzDate}\n${credentialScope}\n${crypto.createHash('sha256').update(canonicalRequest).digest('hex')}`;

  const signingKey = getSignatureKey(secretAccessKey, dateStamp, region, 's3');
  const signature = crypto.createHmac('sha256', signingKey).update(stringToSign).digest('hex');

  const authorizationHeader =
    `${algorithm} Credential=${accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  const options = {
    host: host,
    path: '/',
    method: 'GET',
    headers: {
      'x-amz-date': amzDate,
      'x-amz-content-sha256': payloadHash,
      'Authorization': authorizationHeader,
    }
  };

  return options;
}

export function listSpacesObjects(callback) {
  const options = constructRequest(); // Construct the request here so that the envs are available
  https.request(options, (response) => {
    let dataString = '';
    response.on('data', (data) => {
      dataString += data;
    });
    response.on('end', () => {
      callback(null, dataString);
    });
  }).on('error', (e) => {
    callback(e, null);
  }).end();
}
