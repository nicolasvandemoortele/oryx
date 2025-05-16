const config  = require('../oryx.config');
const fs      = require('fs');
const path    = require("node:path");
const cypress = require("cypress");

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
				if(testCode === '') {
					code = code + `it.skip('${test.title.replace(/[^\w .()-]/g, '')}', () => {\n`;
					code = code + "cy.log('Code empty, skipping test')";
					code = code + "\n});";
				} else {
					code = code + `it('${test.title.replace(/[^\w .()-]/g, '')}', () => {\n`;
					code = code + testCode.replace(/<br>/g,"");
					code = code + "\n});";
				}
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
        console.log("Running Cypress with config:", this.runConfig);
        const results = await cypress.run(this.runConfig);
        return results;
    }
}

const cypressFolderStructure = (root) => ({
    reportDir: path.resolve(root, "cypress/reports"),
    specDir: path.resolve(root, "cypress/e2e"),
    videoDir: path.resolve(root, "cypress/videos"),
});

const extractUUID = (str) => {
	const uuidLen = 36;
	if (str.length <= uuidLen) {
		return str;
	}
	return str.slice(-uuidLen);
}

module.exports = CypressRunner;
