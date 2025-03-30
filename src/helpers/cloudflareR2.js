import fs from "fs";
import https from "https";
import path from "path";
import crypto from "crypto";
import Logger from "../Logger.js";
import config from "../config.js";

// Configure your R2 credentials (locked for IP)
const endpoint = config.cdn.endpoint;
const accessKeyId = config.cdn.accessKeyId;
const secretAccessKey = config.cdn.secretAccessKey;
const bucketName = config.cdn.bucketName;

// Helper function to create HMAC
const hmac = (key, string) => {
  return crypto.createHmac("sha256", key).update(string).digest();
};

// Helper function to create hex-encoded HMAC
const hmacHex = (key, string) => {
  return crypto.createHmac("sha256", key).update(string).digest("hex");
};

export const pushFileToCloudflareR2 = (streamId, sourceFile) => {
  return new Promise((resolve) => {
    if (config.cdn.enabled !== true) {
      Logger.debug(
        `[CDN upload] CDN is not enabled, skipping upload for ${sourceFile}`
      );
      resolve(true);
      return;
    }

    try {
      const fileContent = fs.readFileSync(sourceFile);
      const fileName = `${streamId}/${path.basename(sourceFile)}`;

      // Generate the current date in the required format
      const amzDate = new Date().toISOString().replace(/[:-]|\.\d{3}/g, "");
      const dateStamp = amzDate.slice(0, 8);

      // Create the SHA256 hash of the file content
      const hash = crypto
        .createHash("sha256")
        .update(fileContent)
        .digest("hex");

      // Generate the signing key
      const kDate = hmac(`AWS4${secretAccessKey}`, dateStamp);
      const kRegion = hmac(kDate, "weur"); // Use a valid region name
      const kService = hmac(kRegion, "s3");
      const kSigning = hmac(kService, "aws4_request");

      // Create the canonical request
      const canonicalRequest = [
        "PUT",
        `/${bucketName}/${fileName}`,
        "",
        `host:${endpoint}`,
        `x-amz-content-sha256:${hash}`,
        `x-amz-date:${amzDate}`,
        "",
        "host;x-amz-content-sha256;x-amz-date",
        hash,
      ].join("\n");

      // Create the string to sign
      const stringToSign = [
        "AWS4-HMAC-SHA256",
        amzDate,
        `${dateStamp}/weur/s3/aws4_request`, // Use the same valid region name
        crypto.createHash("sha256").update(canonicalRequest).digest("hex"),
      ].join("\n");

      // Calculate the signature
      const signature = hmacHex(kSigning, stringToSign);

      // Create the request options
      const options = {
        hostname: endpoint,
        port: 443,
        path: `/${bucketName}/${fileName}`,
        method: "PUT",
        headers: {
          "Content-Type": "application/octet-stream",
          "Content-Length": fileContent.length,
          "x-amz-content-sha256": hash,
          "x-amz-date": amzDate,
          Authorization: `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${dateStamp}/weur/s3/aws4_request, SignedHeaders=host;x-amz-content-sha256;x-amz-date, Signature=${signature}`,
        },
      };

      // Create the HTTPS request
      const req = https.request(options, (res) => {
        Logger.debug(`[CDN upload] ${fileName} - ${res.statusCode}`);
        res.setEncoding("utf8");
        res.on("data", (chunk) => {
          // OK
        });
        res.on("end", () => {
          // finished
        });
      });

      // Handle request errors
      req.on("error", (e) => {
        Logger.error(`[CDN upload] Problem with request`, { e });
      });

      // Write the file content to the request body
      req.write(fileContent);

      // End the request
      req.end();

      resolve(true);
    } catch (error) {
      Logger.warn(
        `[CDN upload] Error uploading file to Cloudflare R2: ${error}`
      );
      resolve(false);
    }
  });
};
