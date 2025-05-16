const config        = require('../oryx.config');
const sqs           = require('../libs/sqs');
const CypressRunner = require('./cypressRunner.class');
const cypress       = require('cypress');

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

            switch (body.use) {
                case 'cypress':
                    console.log("Processing Cypress run");
                    // Process the message here
                    const results = await runCypress(body);
                    console.log("Cypress run results:", results);
                    break;
                default:
                    console.error("Invalid message type");
                    continue;
            }

            // Delete the message after processing
            await sqs.deleteMessage(config.sqsQueueUrls.cypress, receiptHandle);
        }
    }

    processMessage();
}

const runCypress = async (params) => {
    // Setup the project folder for Cypress
    let cypressRunner = new CypressRunner(params);

    // Run Cypress with the provided parameters
    // Create runs from each browser and viewports
    const run = params.run;
    const viewports = run.viewports || [{ width: 1280, height: 800 }];
    const browsers = run.browsers || ["electron"];
    for (const browser of browsers) {
        for (const viewport of viewports) {
            cypressRunner.runBrowser = browser;
            cypressRunner.runViewportHeight = viewport.height;
            cypressRunner.runViewportWidth = viewport.width;

            // Create the run folder
            cypressRunner.createRunFolder();
            cypressRunner.generateSpecFiles();

            const results = await cypressRunner.runCypress();
            console.log(JSON.stringify(results.runs));

            cypressRunner.deleteRunFolder();
            
        }
    }

    // Handle the results
    return "Cypress run completed";
}

module.exports = {
    processMessage
}
