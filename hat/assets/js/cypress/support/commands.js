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

Cypress.Commands.add('testInputValue', (id, value) =>
    cy.get(id).invoke('attr', 'value').should('equal', value),
);

Cypress.Commands.add('testMultiSelect', (id, options, accessor = 'name') => {
    const select = cy.get(id).parent();
    const chips = select.find('div[role=button]');
    chips.should('have.length', options.length);
    options.forEach(o => {
        select.should('contain', o[accessor]);
    });
});

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
