const fs              = require('fs');
const path            = require("node:path");
const cypress         = require("cypress");
const { extractUUID } = require("../libs/util");
const { uploadFile }  = require("../libs/s3");

let CypressRunner = class {

    constructor(params) {
        this.runConfig = {
            config: {
                baseUrl: params.run.base_url,
                viewportHeight: 800,
                viewportWidth: 1280,
                numTestsKeptInMemory: 0,
                video: false,
                videoCompression: true,
                retries: 0,
                responseTimeout: 20000,
                requestTimeout: 20000,
                experimentalWebKitSupport: true,
                userAgent: params.agent,
            },
            env: {},
            browser: "electron",
            reporter: "../../node_modules/mochawesome/src/mochawesome.js",
            reporterOptions: {
                reportDir: "/reports",
                overwrite: false,
                html: false,
                json: true,
                timestamp: "mmddyyyy_HHMMss",
                reportFilename: params.run.id,
            },
            headed: false,
            exit: true,
            spec: "*.cy.js",
            project: params.project,
        };
        this.tests = params.run.tests;
        this.runId = params.run.id;
        this.type = params.type;
        this.projectFolder = "";
    }

    set runViewportHeight(height) {
        this.runConfig.config.viewportHeight = height;
    }

    set runViewportWidth(width) {
        this.runConfig.config.viewportWidth = width;
    }

    set runBrowser(browser) {
        this.runConfig.browser = browser;
    }

    createRunFolder() {
        this.projectFolder = fs.mkdtempSync(`${this.runConfig.project}-`);
        fs.cpSync(`./cypress_template/`, this.projectFolder, { recursive: true });
        this.runConfig.project = this.projectFolder;
    }

    deleteRunFolder() {
        fs.rmSync(this.projectFolder, { recursive: true, force: true });
    }

	generateSpecFiles () {
        const specDir = cypressFolderStructure(this.projectFolder).specDir;

        const folders = this.tests.map((test) => {
            return {
                name: extractUUID(test.title),
                tests: [test],
            };
        });

		folders.forEach((folder) => {		
			var code = `describe('${folder.name}', () => {`;
			var test;
			var specs = folder.tests;
			for (test of specs)
			{
				let testCode = test.code;
                const title = test.title.replace(/[^\w .()-]/g, '');
                if(this.type === 'e2e') {
                    if(testCode === '') {
                        code = code + `it.skip('${title}', () => {\n`;
                        code = code + "cy.log('Code empty, skipping test')";
                    } else {
                        code = code + `it('${title}', () => {\n`;
                        code = code + testCode.replace(/<br>/g,"");
                    }
                } else if (this.type === 'visual') {
                    if(testCode === '') {
                        code = code + `it('${title}', () => {\n`;
                        code = code + `cy.visit("${test.url}");\n`;
                        code = code + `cy.oryx_screenshot('${title}');`;
                    } else {
                        code = code + `it('${title}', () => {\n`;
                        code = code + testCode.replace(/<br>/g,"") + "\n";
                        code = code + `cy.oryx_screenshot('${title}');`;
                    }
                }
                code = code + "\n});";
			};

			code = code + "});";

			fs.mkdirSync(specDir, { recursive: true });
			fs.writeFileSync(`${specDir}/${folder.name}_specs.cy.js`, code, { flag: 'w+' });

			console.log(`Generated spec file: ${folder.name}`);
		});

        this.runConfig.spec = path.resolve(specDir, "*.cy.js");
	}

    async runCypress() {
        this.runConfig.reporterOptions.reportDir = cypressFolderStructure(this.projectFolder).reportDir;
        const results = await cypress.run(this.runConfig);
        return results;
    }

    processResults(runResults) {
        const tests = [];
        for (const result of runResults) {
            for (const test of result.tests) {
                const flaky = isFlaky(test.attempts);
                const screenshot = result.screenshots.find(screenshot => 
                    screenshot.path && screenshot.path.includes(test.title[0])
                );
                let screenshotName = "";
                if (screenshot) {
                    screenshotName = `${this.runId}_${test.title[0]}.png`;
                    try {
                        uploadFile(screenshot.path, screenshotName);
                    } catch (error) {
                        console.error("Error uploading screenshot: ", error);
                    }
                    fs.renameSync(screenshot.path, path.join(
                        cypressFolderStructure(this.projectFolder).screenshotDir, 
                        screenshotName
                    ));                                   
                }
                tests.push({
                    title: test.title[0],
                    state: test.state,
                    duration: test.duration,
                    error: test.displayError,
                    flaky: flaky,
                    screenshot: screenshotName,
                });
            }
        }
        
        return tests;
    }
}

const cypressFolderStructure = (root) => ({
    reportDir: path.resolve(root, "cypress/reports"),
    specDir: path.resolve(root, "cypress/e2e"),
    videoDir: path.resolve(root, "cypress/videos"),
    screenshotDir: path.resolve(root, "cypress/screenshots"),
});

const isFlaky = (attempts) => {
    if (attempts.length > 1) {
        return attempts.some(attempt => attempt.state !== attempts[0].state);
    }
    return false
}

module.exports = CypressRunner
