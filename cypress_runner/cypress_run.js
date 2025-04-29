//const cypress = require('cypress');
const config  = require('../oryx.config');

const runCypress = async (params) => {
    // Setup the project folder for Cypress

    // Run Cypress with the provided parameters
    // Create runs from each browser and viewports
    const run = params.run;
    const viewports = run.viewports || [{ width: 1280, height: 800 }];
    const browsers = run.browsers || ["electron"];
    for (const browser of browsers) {
        for (const viewport of viewports) {
            console.log(`Running Cypress with browser: ${browser}, viewport: ${viewport.width}x${viewport.height}`);
        }
    }

    // Handle the results
    return "Cypress run completed";
}


// const runConfig = {
//     config: {
//         baseUrl: params.base_url,
//         viewportHeight: params.height || 800,
//         viewportWidth: params.width || 1280,
//         numTestsKeptInMemory: 0,
//         video: params.video,
//         videoCompression: true,
//         retries: params.retry || 0,
//         responseTimeout: 60000,
//         requestTimeout: 20000,
//         experimentalWebKitSupport: true,
//         userAgent: params.agent,
//     },
//     env: params.environment_variables,
//     browser: params.browser || "electron",
//     reporter: "../../node_modules/mochawesome/src/mochawesome.js",
//     reporterOptions: {
//         reportDir: reportDir,
//         overwrite: false,
//         html: false,
//         json: true,
//         timestamp: "mmddyyyy_HHMMss",
//         reportFilename: runId,
//     },
//     headed: false,
//     exit: true,
//     spec: path.resolve(specDir, "*.cy.js"),
//     project: projectFolder,
// };

module.exports = {
    runCypress
}