/// <reference types="cypress" />
import superUser from '../../fixtures/profiles/me/superuser.json';
import orgUnits from '../../fixtures/orgunits/list.json';
import { testPagination } from '../../support/testPagination';
import { testSearchField } from '../../support/testSearchField';
import { search, searchWithForbiddenChars } from '../../constants/search';

const siteBaseUrl = Cypress.env('siteBaseUrl');
const baseUrl = `${siteBaseUrl}/dashboard/orgunits/list`;

const goToPage = () => {
    cy.login();
    cy.intercept('GET', '/api/profiles/me/**', {
        fixture: 'profiles/me/superuser.json',
    });
    cy.intercept('GET', '/api/groups/**', {
        fixture: 'groups/list.json',
    });
    cy.intercept('GET', '/sockjs-node/**');
    cy.visit(baseUrl);
};

describe('OrgUnits', () => {
    beforeEach(() => {
        goToPage();
    });
    describe('page', () => {
        it('page should not be accessible if user does not have permission', () => {
            const fakeUser = {
                ...superUser,
                permissions: [],
                is_superuser: false,
            };
            cy.intercept('GET', '/api/profiles/me/**', fakeUser);
            cy.visit(baseUrl);
            const errorCode = cy.get('#error-code');
            errorCode.should('contain', '403');
        });

        describe('Search field', () => {
            beforeEach(() => {
                goToPage();
            });
            testSearchField(search, searchWithForbiddenChars, 'orgunits');
        });
    });
    describe('table', () => {
        it('should work on empty results', () => {
            cy.intercept('GET', '/api/orgunits/**', {
                fixture: 'tasks/empty-list.json',
            }).as('getOrgunits');
            cy.visit(baseUrl);
            cy.get('[data-test="search-button"]').click();
            cy.wait('@getOrgunits').then(() => {
                const table = cy.get('table');
                table.should('have.length', 1);
            });
        });

        it('should render results', () => {
            cy.intercept(
                {
                    pathname: '/api/orgunits/**',
                    query: {
                        page: '1',
                    },
                },
                { fixture: 'orgunits/list.json' },
            );
            cy.visit(baseUrl);
            cy.get('[data-test="search-button"]').click();

            const table = cy.get('table');
            table.should('have.length', 1);
            const rows = table.find('tbody').find('tr');
            rows.should('have.length', 50);
            // number of col
            rows.eq(0).find('td').should('have.length', 12);

            const row = cy.get('table').find('tbody').find('tr').eq(0);
            const nameCol = row.find('td').eq(1);
            nameCol.should('contain.text', 'Sierra Leone');
        });
    });

    describe('table pagination', () => {
        before(() => {
            cy.intercept(
                {
                    pathname: '/api/orgunits/**',
                    query: {
                        page: '2',
                    },
                },
                { fixture: 'orgunits/list.json' },
            );
        });
        testPagination({
            baseUrl,
            apiPath: '/api/orgunits/**',
            apiKey: 'orgunits',
            withSearch: true,
            fixture: orgUnits,
        });
    });
});
