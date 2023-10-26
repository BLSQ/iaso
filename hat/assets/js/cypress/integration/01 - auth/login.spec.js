/// <reference types="cypress" />

const siteBaseUrl = Cypress.env('siteBaseUrl');
const sessionCookie = Cypress.env('sessionCookie');
const langageCookie = Cypress.env('langageCookie');

const signInUrl = `${siteBaseUrl}/login/`;

const selectLanguage = lang => {
    cy.window().then(w => {
        // eslint-disable-next-line no-param-reassign
        w.beforeReload = true;
    });
    cy.get('.language-picker').select(lang).should('have.value', lang);
    // this assertion evaluation to true means the page has reloaded, which is needed for the next assertions to pass
    cy.window().should('not.have.prop', 'beforeReload');
    cy.get('html').invoke('attr', 'lang').should('equal', lang);

    cy.getCookie(langageCookie).should('have.property', 'value', lang);
};

describe('Log in page', () => {
    before(() => {
        cy.clearCookie(sessionCookie);
    });
    beforeEach(() => {
        cy.visit(siteBaseUrl);
        cy.intercept('GET', '/sockjs-node/**').as('Yabadabadoo');
    });
    it('going to root url should redirect to log in page', () => {
        cy.url().should('eq', signInUrl);
    });
    it('click on forgot password should redirect to sign up page', () => {
        cy.get('.login-link a').click();
        cy.url().should('eq', `${siteBaseUrl}/forgot-password/`);
    });
    it('click display password should toggle input password type', () => {
        cy.get('#display-password').click();
        cy.get('#id_password').invoke('attr', 'type').should('equal', 'text');
        cy.get('#display-password').click();
        cy.get('#id_password')
            .invoke('attr', 'type')
            .should('equal', 'password');
    });
    it('sessionId cookie should be empty', () => {
        cy.getCookie(sessionCookie).should('not.exist');
    });
    describe('Unhappy flow', () => {
        beforeEach(() => {
            cy.visit(signInUrl);
        });
        it('missing unsername should not submit login', () => {
            cy.get('#id_password').type('Link');
            cy.get('#submit').click();
            cy.url().should('eq', signInUrl);
        });
        it('missing password should not submit login', () => {
            cy.get('#id_username').type('Link');
            cy.get('#submit').click();
            cy.url().should('eq', signInUrl);
        });
        it('wrong credentials should display error message', () => {
            cy.get('#id_username').type('Link');
            cy.get('#id_password').type('ZELDA');
            cy.get('.auth__text--error').should('not.exist');
            cy.get('#submit').click();
            cy.get('.auth__text--error').should('be.visible');
        });
    });
    describe('language selector', () => {
        beforeEach(() => {
            cy.visit(signInUrl);
        });
        it('should default to english', () => {
            cy.get('html').invoke('attr', 'lang').should('equal', 'en');
        });
        it('should set page to selected language', () => {
            selectLanguage('fr');
            selectLanguage('en');
        });
    });
    describe.only('Happy flow', () => {
        beforeEach(() => {
            cy.login();
            cy.visit(siteBaseUrl);
        });
        it('should redirect to dashboard', () => {
            cy.url().should('not.contain', `next`);
            cy.url().should('contain', `/dashboard`);
        });
        it('should set sessionid', () => {
            cy.getCookie(sessionCookie).should('exist');
        });
    });
});
