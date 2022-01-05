/// <reference types="cypress" />

const siteBaseUrl = Cypress.env('siteBaseUrl');

describe('Forms list page', () => {
    beforeEach(() => {
        cy.intercept('GET', '/api/forms/**', { fixture: 'forms' });
        cy.login();
        cy.visit(siteBaseUrl);
    });
    it('going to root url should redirect to log in page', () => {
        cy.url().should('eq', `${siteBaseUrl}/dashboard/forms/list`);
    });
    it('going to root url should redirect to log in page', () => {
        cy.url().should('eq', `${siteBaseUrl}/dashboard/forms/list`);
    });
});
