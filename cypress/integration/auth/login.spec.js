/// <reference types="cypress" />

const siteBaseUrl = Cypress.env('siteBaseUrl');
const sessionCookie = Cypress.env('sessionCookie');
const langageCookie = Cypress.env('langageCookie');

const signInUrl = `${siteBaseUrl}/login/?next=/dashboard/`;

describe('Log in page', () => {
    before(() => {
        cy.clearCookie(sessionCookie);
    });
    it('going to root url should redirect to log in page', () => {
        cy.visit(siteBaseUrl);
        cy.url().should('eq', signInUrl);
    });
    it('click on forgot password should redirect to sign up page', () => {
        cy.visit(signInUrl);
        cy.get('.login-link a').click();
        cy.url().should('eq', `${siteBaseUrl}/forgot-password/`);
    });
    it('click display password should change input password to text', () => {
        cy.visit(signInUrl);
        cy.get('#display-password').click();
        cy.get('#id_password').invoke('attr', 'type').should('equal', 'text');
    });
    it('click display password should change input password back to password', () => {
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
        it('should set page in english', () => {
            cy.get('.language-picker').select('en');
            cy.wait(500);
            cy.get('html').invoke('attr', 'lang').should('equal', 'en');
            cy.getCookie(langageCookie).should('have.property', 'value', 'en');
        });
        it('should set page in french', () => {
            cy.get('.language-picker').select('fr');
            cy.wait(500);
            cy.get('html').invoke('attr', 'lang').should('equal', 'fr');
            cy.getCookie(langageCookie).should('have.property', 'value', 'fr');
        });
    });
    describe('Happy flow', () => {
        before(() => {
            cy.login();
        });
        it('should redirect to dashboard', () => {
            cy.url().should('eq', `${siteBaseUrl}/dashboard/forms/list`);
        });
        it('should set sessionid', () => {
            cy.getCookie(sessionCookie).should('exist');
        });
    });
});
