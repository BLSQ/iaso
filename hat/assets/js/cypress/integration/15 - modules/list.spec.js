/// <reference types="cypress" />

import listFixture from '../../fixtures/modules/list.json';
import superUser from '../../fixtures/profiles/me/superuser.json';

import { testPermission } from '../../support/testPermission';
import { testTablerender } from '../../support/testTableRender';
import { testSearchField } from '../../support/testSearchField';
import { search, searchWithForbiddenChars } from '../../constants/search';

const siteBaseUrl = Cypress.env('siteBaseUrl');
const baseUrl = `${siteBaseUrl}/dashboard/settings/modules`;

const defaultQuery = {
    limit: '20',
    order: 'name',
    page: '1',
};

const goToPage = ({
    formQuery = {},
    fakeUser = superUser,
    fixture = listFixture,
}) => {
    cy.login();
    interceptFlag = false;
    cy.intercept('GET', '/sockjs-node/**');
    cy.intercept('GET', '/api/profiles/me/**', fakeUser);
    const options = {
        method: 'GET',
        pathname: '/api/modules',
    };
    const query = {
        ...defaultQuery,
        ...formQuery,
    };
    cy.intercept({ ...options, query }, req => {
        interceptFlag = true;
        req.reply({
            statusCode: 200,
            body: fixture,
        });
    }).as('getModules');
    cy.visit(baseUrl);
};

describe('Modules', () => {
    describe('Page', () => {
        it('should redirect to url with pagination params', () => {
            goToPage({});

            cy.wait('@getModules').then(() => {
                cy.url().should('eq', `${baseUrl}/accountId/1`);
            });
        });
        it('should not be accessible if user does not have permission', () => {
            testPermission(baseUrl);
        });
    });

    describe('Search field', () => {
        beforeEach(() => {
            goToPage({});
        });
        testSearchField(search, searchWithForbiddenChars);
    });

    describe('Search button', () => {
        beforeEach(() => {
            goToPage({});
        });
        it('should be disabled', () => {
            cy.wait('@getModules').then(() => {
                cy.get('[data-test="search-button"]')
                    .invoke('attr', 'disabled')
                    .should('equal', 'disabled');
            });
        });
        it('should be enabled while searching', () => {
            cy.wait('@getModules').then(() => {
                cy.get('#search-search').type(search);
                cy.get('[data-test="search-button"]')
                    .invoke('attr', 'disabled')
                    .should('equal', undefined);
            });
        });
        it('action should deep link search', () => {
            cy.wait('@getModules').then(() => {
                cy.get('#search-search').type(search);

                cy.get('[data-test="search-button"]').click();
                cy.url().should('contain', `/search/${search}`);
            });
        });
    });

    describe('Table', () => {
        beforeEach(() => {
            goToPage({});
            cy.intercept('GET', '/api/modules', listFixture);
        });

        testTablerender({
            baseUrl,
            rows: listFixture.results.length,
            columns: 4,
            apiKey: 'modules',
        });
    });
});
