import orgUnits from '../fixtures/orgunits/list-tree.json';
import { getCoordinates } from './utils';

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

/**
 * @param {string} username - by default then env username specified
 * @param {string} password - by default then env password specified
 */

Cypress.Commands.add('login', () => {
    const username = Cypress.env('username');
    const password = Cypress.env('password');
    const loginUrl = `${Cypress.env('siteBaseUrl')}/login`;
    const sessionCookie = Cypress.env('sessionCookie');

    cy.session([username, password], () => {
        cy.clearCookie(sessionCookie);
        cy.visit(loginUrl);
        cy.get('#id_username').type(username, { log: false });
        cy.get('#id_password').type(password, { log: false });
        cy.get('#submit').click();
    });
});

/**
 * @param {string} username - by default then env username specified
 * @param {string} password - by default then env password specified
 * This Login way of working is not stable and needs to be improved
 */
Cypress.Commands.add(
    'loginByCSRF',
    (
        username = Cypress.env('username'),
        password = Cypress.env('password'),
    ) => {
        cy.session([username], () => {
            cy.clearCookie(Cypress.env('sessionCookie'));
            cy.request({
                url: `${Cypress.env('siteBaseUrl')}/login/`,
                method: 'HEAD', // cookies are in the HTTP headers, so HEAD suffices
            }).then(() => {
                // cy.getCookie('sessionid').should('not.exist');

                cy.clearCookie(Cypress.env('sessionCookie'));
                cy.getCookie('csrftoken')
                    .its('value')
                    .then(token => {
                        cy.request({
                            url: `${Cypress.env('siteBaseUrl')}/login/`,
                            method: 'POST',
                            form: true,
                            followRedirect: false, // no need to retrieve the page after login
                            body: {
                                username,
                                password,
                                csrfmiddlewaretoken: token,
                            },
                        }).then(() => {
                            cy.getCookie('sessionid').should('exist');
                            return cy.getCookie('csrftoken').its('value');
                        });
                    });
            });
        });
    },
);
/**
 * @param {number} id - DOM id of the input
 * @param {number} newOuIndex - index of the new selected ou
 */
Cypress.Commands.add('fillTreeView', (id, newOuIndex, clear = true) => {
    cy.intercept('GET', '/api/orgunits/tree/**/*', orgUnits).as('getTreeview');
    cy.get(id).as('tree');
    if (clear) {
        cy.get('@tree').find('.clear-tree button').as('clearButton');
        cy.get('@clearButton').click();
    }
    cy.get('@tree').find('.open-tree button').as('openButton');
    cy.get('@openButton').click();
    cy.wait('@getTreeview').then(() => {
        cy.get('.MuiTreeView-root .MuiTreeItem-root').eq(newOuIndex).click();
        cy.get('.MuiDialog-container button').last().click();
    });
});

/**
 * @param {number} id - DOM id of the input
 * @param {string} value - value to check
 */
Cypress.Commands.add('testInputValue', (id, value) =>
    cy.get(id).invoke('attr', 'value').should('equal', value),
);

/**
 * @param {number} id - DOM id of the input
 * @param {array} options - list of possible options
 * @param {string} accessor - key of the option to test, by default 'name'
 */
Cypress.Commands.add('testMultiSelect', (id, options) => {
    cy.get(id)
        .parent()
        .within(() => {
            cy.get('div[role=button]').should('have.length', options.length);
        });
});

/**
 * @param {number} id - Base id used to select DOM element
 * @param {array} selectedOptions - list of options selected ids
 * @param {boolean} clear - clear the input before
 */
Cypress.Commands.add(
    'fillMultiSelect',
    (id, selectedOptions = [], clear = true) => {
        cy.get(id).as('multiSelect');
        cy.get('@multiSelect').click();
        if (clear) {
            cy.get('@multiSelect')
                .parent()
                .find('.MuiAutocomplete-clearIndicator')
                .click();
        }
        selectedOptions.forEach((selectedOption, index) => {
            cy.get(`${id}-option-${selectedOption}`).click();

            // cy.get('@btn').click();
            if (index + 1 < selectedOptions.length) {
                cy.get('@multiSelect').click();
            }
        });
    },
);

/**
 * @param {number} id - Base id used to select DOM element
 * @param {number} selectedOption - option id selected
 */
Cypress.Commands.add('fillSingleSelect', (id, selectedOption = 1) => {
    cy.get(id).click();
    cy.get(`${id}-option-${selectedOption}`).click();
});

/**
 * @param {number} id - Base id used to select DOM element
 * @param {number} newValues - new values list of string
 */
Cypress.Commands.add('fillArrayInputField', (id, newValues = []) => {
    cy.get(`#array-input-field-list-${id}`).as('arrayInputFieldList');
    cy.get('@arrayInputFieldList')
        .find('li')
        .last()
        .find('button')
        .as('addButton');
    newValues.forEach((a, i) => {
        cy.get('@addButton').click();
        // enables testing for empty string
        if (a !== '') cy.get(`#${id}-${i}`).type(a);
    });
});

Cypress.Commands.add('deleteLastFieldInArrayInputField', selector => {
    let arrayInput = null;
    if (selector.includes('@')) {
        arrayInput = cy.get(selector);
    } else {
        arrayInput = cy.get(`#array-input-field-list-${selector}`);
    }
    arrayInput.find('li').last().prev().find('button').click();
    // reassigning addButton
    cy.get('@arrayInputFieldList')
        .find('li')
        .last()
        .find('button')
        .as('addButton');
});

/**
 * @param {number} id - DOM id of the input
 * @param {string} value - new value to fill, by default empty string
 */
Cypress.Commands.add('fillTextField', (id, value = '') => {
    cy.get(id).clear();
    cy.get(id).type(value);
});

/**
 * @param {number} tabIndex - the index of the tab
 * @param {string} parentSelector - DOM selector of the element containing the tabs
 */
Cypress.Commands.add('selectTab', (tabIndex, parentSelector = 'body') => {
    cy.get(parentSelector).find('.MuiTabs-root').as('tabs');
    cy.get('@tabs').find('button').eq(tabIndex).click();
});

// index based, so 1st row = 0
Cypress.Commands.add('findTableCell', (row, column) => {
    return cy
        .get('table')
        .find('tbody')
        .find('tr')
        .eq(row)
        .find('td')
        .eq(column);
});

Cypress.Commands.add('findTableHead', column => {
    return cy.get('table').find('thead').find('tr').eq(0).find('th').eq(column);
});

Cypress.Commands.add('assertTooltipDiplay', identifier => {
    cy.get(`@${identifier}`).should('exist');
    cy.get(`@${identifier}`).trigger('mouseover');
    cy.get(`@${identifier}`).invoke('attr', 'aria-label').should('exist');
});

Cypress.Commands.add('assertButtonTooltipDiplay', (identifier, content) => {
    cy.get(`@${identifier}`).should('exist');
    cy.get(`@${identifier}`).trigger('mouseover');
    cy.get('[role="tooltip"]').should('be.visible').should('contain', content);
});

Cypress.Commands.add('getAndAssert', (selector, identifier) => {
    if (identifier) {
        return cy.get(selector).as(identifier).should('exist');
    }
    return cy.get(selector).should('exist');
});

Cypress.Commands.add('getCoordinates', identifier => {
    const identifierRootText = identifier.replace('@', '').replace('#', '');
    return cy
        .get(identifier)
        .then(cyElement => {
            // console.log(cyElement[0].getBoundingClientRect());
            return cy.wrap(cyElement[0].getBoundingClientRect());
        })
        .as(`${identifierRootText}-coordinates`);
});
Cypress.Commands.add('isAbove', (topElement, bottomElement) => {
    cy.get(topElement)
        .then(getCoordinates)
        .then(topCoordinates => {
            cy.get(bottomElement)
                .then(getCoordinates)
                .then(bottomCoordinates =>
                    cy
                        .wrap(topCoordinates)
                        .its('y')
                        .should('be.lt', bottomCoordinates.y),
                );
        });
});
Cypress.Commands.add('isLeftOf', (leftElement, rightElement) => {
    cy.get(leftElement)
        .then(getCoordinates)
        .then(leftCoordinates => {
            cy.get(rightElement)
                .then(getCoordinates)
                .then(rightCoordinates =>
                    cy
                        .wrap(leftCoordinates)
                        .its('x')
                        .should('be.lt', rightCoordinates.x),
                );
        });
});

/**
 * Wait for the server to be ready before proceeding with tests
 * This helps prevent flaky tests due to server not being fully started
 */
Cypress.Commands.add('waitForServer', () => {
    const maxRetries = 10;
    const retryDelay = 2000; // 2 seconds

    const checkServer = (retryCount = 0) => {
        return cy
            .request({
                url: Cypress.env('siteBaseUrl'),
                method: 'GET',
                failOnStatusCode: false,
                timeout: 5000,
            })
            .then(response => {
                // If we get any response (even 404), the server is up
                if (response.status > 0) {
                    cy.log(`Server is ready after ${retryCount + 1} attempts`);
                    return;
                }
            })
            .catch(error => {
                if (retryCount < maxRetries) {
                    cy.log(
                        `Server not ready, retrying in ${retryDelay}ms (attempt ${retryCount + 1}/${maxRetries})`,
                    );
                    cy.wait(retryDelay);
                    return checkServer(retryCount + 1);
                } else {
                    throw new Error(
                        `Server failed to start after ${maxRetries} attempts: ${error.message}`,
                    );
                }
            });
    };

    return checkServer();
});

/**
 * Robust visit command that retries on connection errors
 * This helps prevent flaky tests due to temporary connection issues
 */
Cypress.Commands.overwrite('visit', (originalFn, url, options) => {
    const maxRetries = 3;
    const retryDelay = 1000; // 1 second

    const attemptVisit = (retryCount = 0) => {
        return originalFn(url, options).catch(error => {
            // Check if it's a connection error
            if (
                error.message.includes('ECONNRESET') ||
                error.message.includes('failed trying to load') ||
                error.message.includes('network level')
            ) {
                if (retryCount < maxRetries) {
                    cy.log(
                        `Connection failed, retrying visit in ${retryDelay}ms (attempt ${retryCount + 1}/${maxRetries})`,
                    );
                    cy.wait(retryDelay);
                    return attemptVisit(retryCount + 1);
                }
            }
            // Re-throw the error if it's not a connection issue or we've exhausted retries
            throw error;
        });
    };

    return attemptVisit();
});
