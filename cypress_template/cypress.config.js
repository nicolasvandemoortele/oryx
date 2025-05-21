const { defineConfig } = require("cypress");
const fs               = require('fs');

module.exports = defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      // implement node event listeners here
      on('task', {
        markupReport: (report, caseId) => {
          const markupFile = `cypress/reports/markup.json`;
          const markup = {
            caseId: caseId,
            report: report,
          };
          try {
            fs.writeFileSync(markupFile, JSON.stringify(markup, null, 2));

            return null;
          } catch (error) {
            console.error("Error writing markup file: ", error);

            return error;
          }
        }
      })
    },
  },
});
