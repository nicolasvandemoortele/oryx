const config        = require('../oryx.config');
const sqs           = require('../libs/sqs');
const CypressRunner = require('./cypressRunner.class');
const VisualRunner  = require('./visualRunner.class');

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
                    await runCypress(body);
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
    let cypressRunner = new CypressRunner(params);
    const project = params.project;
    const run = params.run;
    const viewports = run.viewports || [{ width: 1280, height: 800 }];
    const browsers = run.browsers || ["electron"];
    for (const browser of browsers) {
        for (const viewport of viewports) {
            cypressRunner.runBrowser = browser;
            cypressRunner.runViewportHeight = viewport.height;
            cypressRunner.runViewportWidth = viewport.width;

            cypressRunner.createRunFolder();
            cypressRunner.generateSpecFiles();

            const results = await cypressRunner.runCypress();
            let formattedResults = cypressRunner.processResults(results.runs);

            if(params.type === "visual") {
                const visualRunner = new VisualRunner(project, viewport.name, browser);
                let newFormattedResults = [];
                for (const result of formattedResults) {
                    visualRunner.imageTitles = result.title;
                    visualRunner.markupTitles = result.title;
                    visualRunner.copyCurrent(
                        `${cypressRunner.projectFolder}/cypress/screenshots/${result.screenshot}`,
                        `${cypressRunner.projectFolder}/cypress/reports/markup.json`
                    );

                    if (run.comparison_types.includes("pixel")) {
                        const baseImage = await visualRunner.checkBase(result.screenshot);
                        if (!baseImage) {
                            result.pixelTest = visualRunner.formatResults("Base image not found, setting new base image", 0);
                        } else {
                            const numDiffPixels = visualRunner.comparePixels();
                            result.pixelTest = visualRunner.formatResults("Base image found, comparing images", numDiffPixels);
                        } 
                    }

                    if (run.comparison_types.includes("markup")) {
                        const baseMarkup = await visualRunner.checkBaseMarkup();
                        if(!baseMarkup) {
                            result.markupTest = {msg: "Base markup not found, setting new base markup"};
                        } else {
                            result.markupTest = visualRunner.compareMarkup();
                        }
                    }

                    if (run.comparison_types.includes("ai")) {
                        const baseImage = await visualRunner.checkBase(result.screenshot);
                        if (!baseImage) {
                            result.aiTest = visualRunner.formatResults("Base image not found, setting new base image", 0);
                        } else {
                            const aiResponse = await visualRunner.compareAI();
                            result.aiTest = visualRunner.formatResults(aiResponse);
                        } 
                    }
                    
                    newFormattedResults.push(result);
                }
                formattedResults = newFormattedResults;
            }
            console.log("Formatted results", JSON.stringify(formattedResults, null, 2));
            // await sqs.sendMessage(config.sqsQueueUrls.oryx, {
            //     use: "cypress",
            //     run: {
            //         id: run.id,
            //         browser: browser,
            //         viewport: viewport,
            //         results: formattedResults,
            //     }
            // });

            cypressRunner.deleteRunFolders();
            
        }
    }
}

module.exports = {
    processMessage
}
