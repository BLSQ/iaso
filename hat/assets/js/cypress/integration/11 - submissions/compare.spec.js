/// <reference types="cypress" />

import superUser from '../../fixtures/profiles/me/superuser.json';
import { testPermission } from '../../support/testPermission';

const siteBaseUrl = Cypress.env('siteBaseUrl');
const baseUrl = `${siteBaseUrl}/dashboard/forms/compare/instanceIds/10296,10308`;

describe('Compare submissions', () => {
    beforeEach(() => {
        cy.login();
        cy.intercept('GET', '/api/profiles/me/**', superUser);
    });
    testPermission(baseUrl);

    it('should display all submissions to compare', () => {
        cy.visit(baseUrl);
        cy.get('#top-bar-back-button').should('exist');
    });
});
