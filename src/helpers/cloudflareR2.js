import fs from "fs";
import https from "https";
import path from "path";
import crypto from "crypto";
import Logger from "../Logger.js";

// Configure your R2 credentials (locked for IP)
const endpoint = "3d36a3a1834a9573f04b67abd6960bb3.r2.cloudflarestorage.com";
const accessKeyId = "08cc82974777413a9d233099e35ff505";
const secretAccessKey =
  "3ff3a0e9ae4a4906284ff20d1c04199cb24b9129ca9aed017364ecda2e8d70f3";
const bucketName = "hls";

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
    const fileContent = fs.readFileSync(sourceFile);
    const fileName = `${streamId}/${path.basename(sourceFile)}`;

    // Generate the current date in the required format
    const amzDate = new Date().toISOString().replace(/[:-]|\.\d{3}/g, "");
    const dateStamp = amzDate.slice(0, 8);

    // Create the SHA256 hash of the file content
    const hash = crypto.createHash("sha256").update(fileContent).digest("hex");

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
      Logger.debug(`CDN upload - ${fileName} - ${res.statusCode}`);
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
      Logger.error(`Problem with request`, { e });
    });

    // Write the file content to the request body
    req.write(fileContent);

    // End the request
    req.end();

    resolve();
  });
};
