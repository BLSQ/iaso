/// <reference types='cypress' />

import superUser from '../../fixtures/profiles/me/superuser.json';
import { testPermission } from '../../support/testPermission';
import { testTopBar } from '../../support/testTopBar';
import emptyMapping from '../../fixtures/mappings/empty_paginated_mapping_versions.json';

const siteBaseUrl = Cypress.env('siteBaseUrl');

const baseUrl = `${siteBaseUrl}/dashboard/forms/mappings`;

describe('Mappings', () => {
    beforeEach(() => {
        cy.login();
        cy.intercept('GET', '/api/mappingversions/**', emptyMapping).as(
            'mappingVersions',
        );
        cy.intercept('GET', '/api/datasources/**', []).as('dataSources');
        cy.intercept('GET', '/api/profiles/me/**', superUser);
    });
    describe('When mounting', () => {
        testPermission(baseUrl);
        testTopBar(baseUrl, 'DHIS mappings', false);

        it('renders and calls API', () => {
            cy.visit(baseUrl);
            cy.wait('@mappingVersions');
            cy.wait('@dataSources');
            cy.getAndAssert('table');
            cy.getAndAssert('[data-test="create-mapping"]');
        });
    });
});
