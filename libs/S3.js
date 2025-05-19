// Handle upload and download of files to S3
const {
    S3Client,
    PutObjectCommand,
    GetObjectCommand,
    DeleteObjectCommand,
    ListObjectsV2Command
} = require ('@aws-sdk/client-s3');
const fs = require('fs');
const mime = require('mime-types');

const config = require('../oryx.config');

const s3Client = new S3Client({
    region: config.awsRegion,
    credentials: {
        accessKeyId: config.awsAccessKeyId,
        secretAccessKey: config.awsAccessKey
    }
});

const bucketName = config.s3BucketName;

/**
 * Uploads a file to S3
 * @param {string} file - The file to upload
 * @param {string} newFile - The new file name (optional)
 * @returns {Promise<void>}
 */
const uploadFile = async (file, newFile = file) => {
        const type = mime.contentType(file);

    if (!fs.existsSync(file)) {
        logger.error(`File to upload ${file} does not exist`);
        return;
    }

    const fileContent = fs.readFileSync(file);
    const uploadParams = {
        Bucket: bucketName,
        Key: newFile,
        ContentDisposition: "inline",
        ContentType: type,
        Body: fileContent,
        Expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7)
    };
    console.log(`Uploading file ${file} to S3 bucket ${bucketName} with key ${newFile}`);
    return s3Client.send(new PutObjectCommand(uploadParams));
}

/**
 * Checks if a file exists in S3
 * @param {string} file - The file to check
 * @returns {Promise<boolean>} - True if the file exists, false otherwise
 */
const checkFileExists = async (file) => {
    const params = {
        Bucket: bucketName,
        Key: file
    };

    try {
        await s3Client.send(new GetObjectCommand(params));
        return true;
    } catch (error) {
        if (error.name === 'NoSuchKey') {
            return false;
        }
        throw error;
    }
}

/**
* Downloads a file from S3
 * @param {string} file - The file to download
 * @param {string} destination - The destination to save the file
 * @returns {Promise<void>}
 */
const downloadFile = async (file, destination) => {
    const params = {
        Bucket: bucketName,
        Key: file
    };

    const data = await s3Client.send(new GetObjectCommand(params));
    const writeStream = fs.createWriteStream(destination);
    data.Body.pipe(writeStream);

    return new Promise((resolve, reject) => {
        writeStream.on('finish', () => {
            console.log(`Downloaded file ${file} from S3 to ${destination}`);
            resolve();
        });
        writeStream.on('error', (error) => {
            console.error(`Error downloading file ${file} from S3:`, error);
            reject(error);
        });
    });
}

module.exports = {
    uploadFile,
    checkFileExists,
    downloadFile,
}