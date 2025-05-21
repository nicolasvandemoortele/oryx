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

Cypress.Commands.add(
  'markup_snapshot',
  (locators, caseId) => {
    let markups = [];
    for (const locator of locators) {
      cy.get(locator).then(($el) => {
        const style = $el.attr("style");
        const css = $el.attr("class");
        const height = window.getComputedStyle($el[0]).height;
        const width = window.getComputedStyle($el[0]).width;
        const color = window.getComputedStyle($el[0]).color;
        const backgroundColor = window.getComputedStyle($el[0]).backgroundColor;
        const fontSize = window.getComputedStyle($el[0]).fontSize;
        const fontFamily = window.getComputedStyle($el[0]).fontFamily;
        const fontWeight = window.getComputedStyle($el[0]).fontWeight;
        const fontStyle = window.getComputedStyle($el[0]).fontStyle;
        const textAlign = window.getComputedStyle($el[0]).textAlign;
        const visibility = window.getComputedStyle($el[0]).visibility;
        const markup = {
          locator: locator,
          style: style,
          css: css,
          height: height,
          width: width,
          color: color,
          backgroundColor: backgroundColor,
          fontSize: fontSize,
          fontFamily: fontFamily,
          fontWeight: fontWeight,
          fontStyle: fontStyle,
          textAlign: textAlign,
          visibility: visibility
        }
        markups.push(markup);
      })
    }
    cy.task(
      'markupReport',
      { markups, caseId }
    )
  }
)
