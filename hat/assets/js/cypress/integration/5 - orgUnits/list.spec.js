/// <reference types="cypress" />

import { formatThousand } from 'bluesquare-components';
import superUser from '../../fixtures/profiles/me/superuser.json';
import orgUnits from '../../fixtures/orgunits/list.json';

const siteBaseUrl = Cypress.env('siteBaseUrl');

const baseUrl = `${siteBaseUrl}/dashboard/orgunits/list`;

describe('OrgUnits', () => {
    beforeEach(() => {
        cy.login();
        cy.intercept('GET', '/api/profiles/me/**', {
            fixture: 'profiles/me/superuser.json',
        });
        cy.intercept('GET', '/api/groups/**', {
            fixture: 'groups/list.json',
        });
        cy.intercept('GET', '/sockjs-node/**');
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
    });
    describe('table', () => {
        it('should work on empty results', () => {
            cy.intercept('/api/orgunits/**', {
                fixture: 'tasks/empty-list.json',
            });
            cy.visit(baseUrl);
            cy.contains('.MuiGrid-container button', 'Search').click();
            const table = cy.get('table');
            table.should('have.length', 1);
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
            cy.get('#searchButton').click();

            const table = cy.get('table');
            table.should('have.length', 1);
            const rows = table.find('tbody').find('tr');
            rows.should('have.length', 50);
            // number of col
            rows.eq(0).find('td').should('have.length', 11);

            const row = cy.get('table').find('tbody').find('tr').eq(0);
            const nameCol = row.find('td').eq(1);
            nameCol.should('contain.text', 'Sierra Leone');

            cy.get('button.pagination-next').as('nextButton').click();
            cy.intercept(
                {
                    pathname: '/api/orgunits/**',
                    query: {
                        page: '2',
                    },
                },
                { fixture: 'orgunits/list-page2.json' },
            ).as('page2');
            cy.wait('@page2');

            const row2 = cy.get('table').find('tbody').find('tr').eq(0);
            const nameCol2 = row2.find('td').eq(1);
            nameCol2.should('contain.text', 'Yemoh MCHP');
        });
    });
    describe('pagination', () => {
        beforeEach(() => {
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
            cy.get('#searchButton').click();
        });
        it('click on next should display next page', () => {
            cy.get('.pagination-page-select input')
                .as('pageInput')
                .should('have.value', 1);

            cy.get('button.pagination-previous')
                .as('previousButton')
                .should('be.disabled');
            cy.get('button.pagination-first')
                .as('firstButton')
                .should('be.disabled');
            cy.get('.pagination-count').should(
                'contain',
                `${formatThousand(orgUnits.count)}`,
            );

            cy.get('button.pagination-next').click();
            cy.get('@pageInput').should('have.value', 2);
            cy.get('@previousButton').should('not.be.disabled');
            cy.get('@firstButton').should('not.be.disabled');
        });
        it('click on last should display last page', () => {
            cy.get('.pagination-page-select input')
                .as('pageInput')
                .should('have.value', 1);

            cy.get('button.pagination-last').as('lastButton').click();

            cy.get('@lastButton').should('be.disabled');
            cy.get('@pageInput').should('have.value', orgUnits.pages);
        });
        it('click on first should display first page', () => {
            cy.get('.pagination-page-select input')
                .as('pageInput')
                .should('have.value', 1);

            cy.intercept(
                {
                    pathname: '/api/orgunits/**',
                    query: {
                        page: `${orgUnits.pages}`,
                    },
                },
                { fixture: 'orgunits/list.json' },
            ).as('getOrgUnit');
            cy.get('button.pagination-last').click();
            cy.wait('@getOrgUnit').then(() => {
                cy.get('button.pagination-first').click();
                cy.get('@pageInput').should('have.value', 1);
            });
        });
        it('changing rows count should display the correct ammount of rows', () => {
            cy.get('.pagination-row-select').click();
            const pageSize = 5;
            const res = { ...orgUnits };
            res.orgunits = res.orgunits.slice(0, pageSize);
            cy.intercept(
                {
                    pathname: '/api/orgunits/**',
                    query: {
                        limit: `${pageSize}`,
                    },
                },
                res,
            ).as('getOrgUnit');
            cy.get(`.row-option-${pageSize}`).click();

            cy.wait('@getOrgUnit').then(() => {
                const table = cy.get('table');
                table.should('have.length', 1);
                const rows = table.find('tbody').find('tr');
                rows.should('have.length', pageSize);
            });
        });
        it('search again should go to first page', () => {
            cy.intercept(
                {
                    pathname: '/api/orgunits/**',
                },
                { fixture: 'orgunits/list.json' },
            ).as('getOrgUnit');
            cy.get('button.pagination-next').click();

            cy.wait('@getOrgUnit').then(() => {
                cy.get('.pagination-page-select input')
                    .as('pageInput')
                    .should('have.value', 2);
                const search = 'ZELDA';
                cy.get('#search-search-0').type(search);
                const res = { ...orgUnits };
                res.orgunits = res.orgunits.slice(0, 1);
                cy.intercept(
                    {
                        pathname: '/api/orgunits/**',
                    },
                    res,
                ).as('getOrgUnitSearch');
                cy.get('#searchButton').click();

                cy.wait('@getOrgUnitSearch').then(() => {
                    cy.get('@pageInput').should('have.value', 1);
                });
            });
        });
    });
});
