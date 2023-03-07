/// <reference types="cypress" />
import superUser from '../../fixtures/profiles/me/superuser.json';
import orgUnits from '../../fixtures/orgunits/list.json';
import { forbiddenCharacters } from '../../constants/forbiddenChars';
import { containsForbiddenCharacter } from '../../support/utils';

import { testPagination } from '../../support/testPagination';

const siteBaseUrl = Cypress.env('siteBaseUrl');

const search = 'mario';
const searchWithForbiddenChars = 'ma/ri&o';

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
            errorCode.should('contain', '401');
        });

        describe('Search field', () => {
            beforeEach(() => {
                goToPage();
            });
            it('should enable search button', () => {
                cy.get('[data-test="search-button"]')
                    .as('search-button')
                    .should('not.be.disabled');
                cy.get('#search-search').type(search);
                cy.get('@search-button').should('not.be.disabled');
            });

            it('should disable search button if search contains forbidden characters', () => {
                cy.get('[data-test="search-button"]').as('search-button');
                cy.get('#search-search').type(searchWithForbiddenChars);
                if (
                    containsForbiddenCharacter(
                        searchWithForbiddenChars,
                        forbiddenCharacters,
                    )
                ) {
                    cy.get('@search-button').should('be.disabled');
                }
            });
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
