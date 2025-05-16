// ***********************************************************
// This example support/index.js is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import './commands'
import './custom_commands'

//Import plugins
import 'cypress-xpath'
import 'cypress-real-events/support'
import 'cypress-file-upload'
import '@faker-js/faker'

Cypress.on('uncaught:exception', (err, runnable) => {return false});

// Alternatively you can use CommonJS syntax:
// require('./commands')
/**
 *
 * @see https://www.chaijs.com/guide/helpers/
 * @example
 ```
  expect(url).to.be.baseUrl()
  expect(url).to.not.be.baseUrl()
  cy.url().should('be.baseUrl')
  cy.url().should('not.be.baseUrl')
```
 * */
const isBaseUrl = (_chai, utils) => {
    function assertIsBaseUrl (options) {
      this.assert(
        (this._obj === Cypress.config('baseUrl')
            || this._obj === Cypress.config('baseUrl') + '/'),
        'expected #{this} to be the base url',
        'expected #{this} to not be the base url',
        this._obj
        )
    }
  
    _chai.Assertion.addMethod('baseUrl', assertIsBaseUrl)
  }
  
  chai.use(isBaseUrl)
