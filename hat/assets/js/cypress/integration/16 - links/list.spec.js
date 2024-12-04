/// <reference types='cypress' />

import superUser from '../../fixtures/profiles/me/superuser.json';
import { testPermission } from '../../support/testPermission';
import { testTopBar } from '../../support/testTopBar';
import orgUnitTypes from '../../fixtures/orgunittypes/dropdown-list.json';

const siteBaseUrl = Cypress.env('siteBaseUrl');

const baseUrl = `${siteBaseUrl}/dashboard/settings/sources/links/list`;

describe('Links', () => {
    beforeEach(() => {
        cy.login();
        cy.intercept('GET', '/api/algorithms/', []).as('algorithms');
        cy.intercept('GET', '/api/algorithmsruns/', []).as('runs');
        cy.intercept('GET', '/api/datasources/', []).as('dataSources');
        cy.intercept('GET', '/api/v2/orgunittypes/dropdown/', orgUnitTypes).as(
            'orgUnitTypes',
        );
        cy.intercept('GET', '/api/profiles/me/**', superUser);
    });
    describe('When mounting', () => {
        testPermission(baseUrl);
        testTopBar(baseUrl, 'Links validation', false);

        it('renders and calls filters APIs', () => {
            cy.visit(baseUrl);
            cy.wait('@algorithms');
            cy.wait('@runs');
            cy.wait('@dataSources');
            cy.wait('@orgUnitTypes');
            cy.getAndAssert('[data-test="search-button"]');
        });
    });
});
