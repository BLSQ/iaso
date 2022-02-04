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
Cypress.Commands.add(
    'login',
    (
        username = Cypress.env('username'),
        password = Cypress.env('password'),
    ) => {
        cy.session([username], () => {
            cy.clearCookie(Cypress.env('sessionCookie'));
            cy.visit(Cypress.env('siteBaseUrl'));
            cy.get('#id_username').type(username, { log: false });
            cy.get('#id_password').type(password, { log: false });
            cy.get('#submit').click();
        });
    },
);

/**
 * @param {string} username - by default then env username specified
 * @param {string} password - by default then env password specified
 * This Login way of working is not stable an needs to be improved
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
Cypress.Commands.add('fillTreeView', (id, newOuIndex) => {
    cy.get(id).as('tree');
    cy.get('@tree').find('.clear-tree button').as('clearButton');
    cy.get('@clearButton').click();
    cy.get('@tree').click();
    cy.get('@tree')
        .find('.input-label')
        .parent()
        .find('div[role=button]')
        .click();
    cy.get('.MuiTreeView-root .MuiTreeItem-root').eq(newOuIndex).click();
    cy.get('.MuiDialog-container button').last().click();
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
Cypress.Commands.add('testMultiSelect', (id, options, accessor = 'name') => {
    const select = cy.get(id).parent();
    const chips = select.find('div[role=button]');
    chips.should('have.length', options.length);
    options.forEach(o => {
        select.should('contain', o[accessor]);
    });
});

/**
 * @param {number} id - Base id used to select DOM element
 * @param {array} selectedOptions - list of options selected ids
 */
Cypress.Commands.add('fillMultiSelect', (id, selectedOptions = []) => {
    cy.get(id).as('multiSelect');
    cy.get('@multiSelect').click();
    cy.get('@multiSelect')
        .parent()
        .find('.MuiAutocomplete-clearIndicator')
        .click();
    selectedOptions.forEach((selectedOption, index) => {
        cy.get(`${id}-option-${selectedOption}`).click();
        if (index + 1 < selectedOptions.length) {
            cy.get('@multiSelect').click();
        }
    });
});

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
    cy.get('@arrayInputFieldList').find(`#${id}-0`).parent().next().click();
    cy.get('@arrayInputFieldList')
        .find('li')
        .last()
        .find('button')
        .as('addButton');
    newValues.forEach((a, i) => {
        cy.get('@addButton').click();
        cy.get(`#${id}-${i}`).type(a);
    });
});

/**
 * @param {number} id - DOM id of the input
 * @param {string} value - new value to fill, by default empty string
 */
Cypress.Commands.add('fillTextField', (id, value = '') => {
    cy.get(id).clear().type(value);
});
