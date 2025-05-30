# oryx

Oryx is a service made to perform visual regression testing on any webapp page. The testing is done using 3 layers:
* Pixel differences
* Styling differences
* AI analysis

Additionally it can perform Accessibility testing checks on the same pages.

The service reads from an SQS queue, and uses Cypress/Playwright to gather screenshots and markup information on the pages submitted.
