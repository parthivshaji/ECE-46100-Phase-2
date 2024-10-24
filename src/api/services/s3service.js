"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.downloadFile = exports.uploadFile = void 0;
const client_s3_1 = require("@aws-sdk/client-s3");
const stream_1 = require("stream");
// Create S3 client instance
const s3 = new client_s3_1.S3Client({ region: 'us-east-2' });
// Upload a file to S3
const uploadFile = (bucketName, key, content) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const command = new client_s3_1.PutObjectCommand({
            Bucket: bucketName,
            Key: key,
            Body: content,
        });
        const response = yield s3.send(command);
        console.log(`File uploaded successfully. ${response.ETag}`);
    }
    catch (error) {
        console.error(`Error uploading file: ${error}`);
    }
});
exports.uploadFile = uploadFile;
// Download a file from S3
const downloadFile = (bucketName, key) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const command = new client_s3_1.GetObjectCommand({
            Bucket: bucketName,
            Key: key,
        });
        const response = yield s3.send(command);
        if (response.Body instanceof stream_1.Readable) {
            const data = yield streamToString(response.Body);
            console.log(`File downloaded successfully: ${data}`);
            return data;
        }
        return null;
    }
    catch (error) {
        console.error(`Error downloading file: ${error}`);
        return null;
    }
});
exports.downloadFile = downloadFile;
// Helper function to convert Readable stream to string
const streamToString = (stream) => new Promise((resolve, reject) => {
    const chunks = [];
    stream.on('data', (chunk) => chunks.push(chunk));
    stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
    stream.on('error', reject);
});
