/// <reference types="cypress" />

import superUser from '../../fixtures/profiles/me/superuser.json';

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
    describe('Table', () => {
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
            cy.get(
                '.MuiTablePagination-root .MuiOutlinedInput-inputMarginDense',
            ).should('have.value', 1);

            const row = cy.get('table').find('tbody').find('tr').eq(0);
            const nameCol = row.find('td').eq(1);
            nameCol.should('contain.text', 'ANGOLA');

            // Click on next page
            cy.get(`button[aria-label="Previous"]`).should('be.disabled');
            cy.get(`button[aria-label="Next"]`).click();
            // page number
            cy.get(
                '.MuiTablePagination-root .MuiOutlinedInput-inputMarginDense',
            ).should('have.value', 2);
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
            nameCol2.should('contain.text', 'CÔTE D’IVOIRE');
        });
    });
});
