/// <reference types="cypress" />

const siteBaseUrl = Cypress.env('siteBaseUrl');

const search = 'ZELDA';
const baseUrl = `${siteBaseUrl}/dashboard/forms/list`;

describe('Forms list page', () => {
    beforeEach(() => {
        cy.intercept('GET', '/api/forms/**', { fixture: 'forms/list.json' });
        cy.login();
        cy.visit(baseUrl);
    });
    it('click on create button should redirect to fom creation url', () => {
        cy.get('#add-button-container').find('button').click();
        cy.url().should('eq', `${siteBaseUrl}/dashboard/forms/detail/formId/0`);
    });
    describe('Search button', () => {
        it('should be disabled', () => {
            cy.get('#search-button')
                .invoke('attr', 'disabled')
                .should('equal', 'disabled');
        });
        it('action should deep link active search', () => {
            cy.get('#search-search').type(search);
            cy.get('#search-button').click();
            cy.url().should(
                'eq',
                `${baseUrl}/page/1/search/${search}/searchActive/true`,
            );
        });
    });
    describe('Search field', () => {
        it('should enabled search button', () => {
            cy.get('#search-search').type(search);
            cy.get('#search-button')
                .invoke('attr', 'disabled')
                .should('equal', undefined);
        });
        it('should deep link search', () => {
            cy.get('#search-search').type(search);
            cy.url().should('eq', `${baseUrl}/search/${search}`);
        });
    });
    describe('Exports buttons', () => {
        it('should be visible if we have results', () => {
            cy.get('#csv-export-button').should('be.visible');
            cy.get('#xlsx-export-button').should('be.visible');
        });
        it("should not be visible if we don't have results", () => {
            cy.intercept('GET', '/api/forms/**', {
                fixture: 'forms/empty.json',
            });
            cy.visit(baseUrl);
            cy.get('#csv-export-button').should('not.exist');
            cy.get('#xlsx-export-button').should('not.exist');
        });
    });
});
