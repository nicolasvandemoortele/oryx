// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
// Cypress.Commands.add('login', (email, password) => { ... })
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })

// Cypress.Commands.add('accessibility', (url, options = {}) => {
//   const impacts = options.impacts || ['critical'];
//   const pass = options.pass || false;
//   let impact_list;

//   if(typeof(impacts) === 'string') {
//     impact_list = [ impacts ];
//   } else {
//     impact_list = impacts;
//   }

//   cy.visit(url)
//   cy.injectAxe()
//   cy.checkA11y(
//     null,
//     { includedImpacts: impact_list },
//     createReport,
//     pass
//   )
// })


// function createReport(violations) {
//   let report = [];
//   violations.forEach((violation) => {
//       let axeViolation = {
//           'id': violation.id,
//           'impact': violation.impact,
//           'description': violation.description,
//           'help': violation.help,
//           'url': violation.url,
//           'helpUrl': violation.helpUrl,
//           'nodes': []
//       }
//       violation.nodes.forEach((node) => {
//           let axeNode = {
//               'html': escape(node.html),
//               'failure': node.failureSummary
//           }
//           axeViolation.nodes.push(axeNode);
//       })
//       report.push(axeViolation);
//   })
//   cy.url().then((url) => {
//     cy.task(
//         'axeReport',
//         { report: report, url: url}
//     )
//   })
// }

function escape(htmlStr) {
   return htmlStr.replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#39;");
}

Cypress.Commands.add(
  'oryx_screenshot',
  (name) => {
    const title = Cypress.currentTest.title
    const uuid = title.match(/\w{8}-\w{4}-\w{4}-\w{4}-\w{12}/)
    const imageName = name.replace(" ", "_")

    cy.screenshot(`${uuid}_${imageName}`, {capture: 'viewport'})    
  }
)
