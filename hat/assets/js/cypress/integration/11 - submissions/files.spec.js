/// <reference types="cypress" />

import superUser from '../../fixtures/profiles/me/superuser.json';
import { testPermission } from '../../support/testPermission';

const siteBaseUrl = Cypress.env('siteBaseUrl');
const baseUrl = `${siteBaseUrl}/dashboard/forms/submissions/accountId/2/tab/files/mapResults/3000`;


describe('Files submissions', () => {
    beforeEach(() => {
        cy.login();
        cy.intercept('GET', '/api/profiles/me/**', superUser);
    });
    testPermission(baseUrl);

    it('should diplay multiples files with checkBox', () => {
        cy.visit(baseUrl);
    })

});