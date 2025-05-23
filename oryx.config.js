const dotenv = require('dotenv');

dotenv.config();

const config = {
    awsRegion:          process.env.AWS_REGION_ENV || 'us-east-1',
    awsAccessKeyId:     process.env.AWS_ACCESS_KEY_ID_ENV,
    awsAccessKey:       process.env.AWS_SECRET_ACCESS_KEY_ENV,
    port:               process.env.PORT,
    s3BucketName:       process.env.BUCKET_RUNNER_ENV,
    openaiAPIKey:       process.env.OPENAI_API_KEY_ENV,
    sqsQueueUrls:       {
        cypress: process.env.CYPRESS_QUEUE_URL_ENV,
        oryx:    process.env.ORYX_QUEUE_URL_ENV,
    }
};

module.exports = config;
