/// <reference types="cypress" />

import listFixture from '../../fixtures/modules/list.json';
import superUser from '../../fixtures/profiles/me/superuser.json';
import entityTypes from '../../fixtures/entityTypes/list.json';

import { testPermission } from '../../support/testPermission';
import { testTablerender } from '../../support/testTableRender';
import { testSearchField } from '../../support/testSearchField';
import { testPagination } from '../../support/testPagination';

import { search, searchWithForbiddenChars } from '../../constants/search';

const siteBaseUrl = Cypress.env('siteBaseUrl');
const baseUrl = `${siteBaseUrl}/dashboard/settings/modules`;
// eslint-disable-next-line no-unused-vars
let interceptFlag = false;

const mockPage = (fakeUser = superUser, fixture = listFixture) => {
    cy.login();
    interceptFlag = false;
    cy.intercept('GET', '/sockjs-node/**');
    cy.intercept('GET', '/api/entitytypes/?order=name', entityTypes);
    cy.intercept('GET', '/api/profiles/me/**', fakeUser);
    cy.intercept('GET', '/api/modules/**/*', req => {
        interceptFlag = true;
        req.reply({
            statusCode: 200,
            body: fixture,
        });
    }).as('getModules');
};

describe('Modules', () => {
    describe('Page', () => {
        it('should redirect to url with pagination params', () => {
            mockPage();
            cy.visit(baseUrl);

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
            mockPage();
            cy.visit(baseUrl);
        });
        testSearchField(search, searchWithForbiddenChars);
    });

    describe('Search button', () => {
        beforeEach(() => {
            mockPage();
            cy.visit(baseUrl);
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
            mockPage();
        });

        testTablerender({
            baseUrl,
            rows: listFixture.results.length,
            columns: 3,
            apiKey: 'modules',
        });

        testPagination({
            baseUrl,
            apiPath: '/api/modules/',
            apiKey: 'results',
            withSearch: false,
            fixture: listFixture,
        });
    });
});
