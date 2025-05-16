const {
    SQSClient,
    ReceiveMessageCommand,
    DeleteMessageCommand
} = require ('@aws-sdk/client-sqs');

const config = require('../oryx.config');

const sqsClient = new SQSClient({
    region: config.awsRegion,
    credentials: {
        accessKeyId: config.awsAccessKeyId,
        secretAccessKey: config.awsAccessKey
    }
});

const maxMessages = 1;
const waitTime = 10;

/**
 * Receives a message from an SQS queue
 * @param {string} queueUrl - The URL of the SQS queue
 * @returns {Promise<Object>} - A promise that resolves to the received message
 */
const receiveMessage = async (queueUrl) => {
    const params = {
        QueueUrl: queueUrl,
        MaxNumberOfMessages: maxMessages,
        WaitTimeSeconds: waitTime
    };

    try {
        const data = await sqsClient.send(new ReceiveMessageCommand(params));
        return data.Messages;
    } catch (error) {
        console.error("Error receiving message:", error);
        throw error;
    }
};

/**
 * Sends a message to an SQS queue
 * @param {string} queueUrl - The URL of the SQS queue
 * @param {Object} messageBody - The message body to send
 * @returns {Promise<string>} - A promise that resolves to the message ID
 */
const sendMessage = async (queueUrl, messageBody) => {
    const params = {
        QueueUrl: queueUrl,
        MessageBody: JSON.stringify(messageBody)
    };

    try {
        const data = await sqsClient.send(new SendMessageCommand(params));
        return data.MessageId;
    } catch (error) {
        console.error("Error sending message:", error);
        throw error;
    }
};

/**
 * Deletes a message from an SQS queue
 * @param {string} queuUrl - The URL of the SQS queue
 * @param {string} receiptHandle - The receipt handle of the message to delete
 */
const deleteMessage = async (queueUrl, receiptHandle) => {
    const params ={
        QueueUrl: queueUrl,
        ReceiptHandle: receiptHandle
    };

    try {
        await sqsClient.send(new DeleteMessageCommand(params));
    } catch (error) {
        console.error("Error deleting message:", error);
        throw error;
    }
};

module.exports = {
    receiveMessage,
    sendMessage,
    deleteMessage,
}