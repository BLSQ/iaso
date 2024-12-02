/// <reference types='cypress' />

import superUser from '../../fixtures/profiles/me/superuser.json';
import { testPermission } from '../../support/testPermission';
import { testTopBar } from '../../support/testTopBar';

const siteBaseUrl = Cypress.env('siteBaseUrl');

const baseUrl = `${siteBaseUrl}/dashboard/forms/stats/completeness`;

describe('Completeness', () => {
    beforeEach(() => {
        cy.login();
        cy.intercept('GET', '/api/completeness/', {
            completeness: [],
        }).as('completeness');
        cy.intercept('GET', '/api/profiles/me/**', superUser);
    });
    describe('When mounting', () => {
        testPermission(baseUrl);
        testTopBar(baseUrl, 'Completeness', false);

        it('renders and calls API', () => {
            cy.visit(baseUrl);
            cy.wait('@completeness');
            cy.getAndAssert('#periodType');
        });
    });
});
