/// <reference types="cypress" />

import superUser from '../../fixtures/profiles/me/superuser.json';

const siteBaseUrl = Cypress.env('siteBaseUrl');
const baseUrl = `${siteBaseUrl}/dashboard/entities/duplicates/details/accountId/1/entities/883,163`;

const mockPage = () => {
    cy.login();
    cy.intercept('GET', '/sockjs-node/**');
    cy.intercept('GET', '/api/profiles/me/**', {
        fixture: 'profiles/me/superuser.json',
    }).as('getProfile');
    cy.intercept('GET', '/api/entityduplicates/detail/?entities=883%2C163', {
        fixture: 'duplicates/details.json',
    }).as('getDetails');
    cy.intercept('GET', '/api/entityduplicates/?entities=883%2C163', {
        fixture: 'duplicates/list-details.json',
    }).as('getDetailsDuplicate');
    cy.intercept(
        'GET',
        '/api/instances/?order=-created_at&with_descriptor=true&entityId=163',
        {
            fixture: 'duplicates/instances-a.json',
        },
    );
    cy.intercept(
        'GET',
        '/api/instances/?order=-created_at&with_descriptor=true&entityId=883',
        {
            fixture: 'duplicates/instances-b.json',
        },
    );
};

describe('Workflows details', () => {
    it('page should not be accessible if user does not have permission', () => {
        const fakeUser = {
            ...superUser,
            permissions: [],
            is_superuser: false,
        };
        mockPage();
        cy.intercept('GET', '/api/profiles/me/**', fakeUser);
        cy.visit(baseUrl);
        const errorCode = cy.get('#error-code');
        errorCode.should('contain', '401');
    });

    it('should show correct infos', () => {
        mockPage();
        cy.visit(baseUrl);

        cy.wait(['@getDetails', '@getDetailsDuplicate']).then(() => {
            cy.url().should('eq', baseUrl);
        });
    });
});
