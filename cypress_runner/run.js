const config  = require('../oryx.config');
const sqs     = require('../libs/sqs');
const cypress = require('./cypress_run');

/**
 * Processes messages from the SQS queue
 * @returns {Promise<void>}
 */
const processMessage = async () => {
    const messages = await sqs.receiveMessage(config.sqsQueueUrls.cypress)

    if(!messages || messages.length === 0) {
        console.log("No messages to process");

    } else {

        for (const message of messages) {

            const receiptHandle = message.ReceiptHandle;
            const body = JSON.parse(message.Body);
            console.log("Received message:", body);

            // Check structure of the message
            if (body.use !== 'cypress') {
                console.error("Invalid message type");
                continue;
            }

            // Process the message here
            const results = cypress.runCypress(body);
            console.log("Cypress run results:", results);

            // Delete the message after processing
            await sqs.deleteMessage(config.sqsQueueUrls.cypress, receiptHandle);
        }
    }

    processMessage();
}

module.exports = {
    processMessage
}
