"use strict";
const minio = require('minio');
const { env } = require('../../config');
class MinioClient {
    constructor() {
        this.client = new minio.Client({
            endPoint: env.STORAGE_HOST,
            accessKey: env.STORAGE_ACCESS_KEY,
            secretKey: env.STORAGE_SECRET_KEY,
            port: 443,
            useSSL: true
        });
        this.client.setRequestOptions({
            rejectUnauthorized: false
        });
    }
    async getUploadUrl(key) {
        const storageBucketName = 'guardrails-cli';
        const bucketExist = await this.client.bucketExists(storageBucketName);
        if (!bucketExist) {
            await this.client.makeBucket(storageBucketName);
        }
        const signedUrl = await this.client.presignedPutObject(storageBucketName, key, 60);
        return signedUrl;
    }
}
module.exports = new MinioClient();
//# sourceMappingURL=minio.js.map