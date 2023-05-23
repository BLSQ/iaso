/// <reference types="cypress" />

import superUser from '../../fixtures/profiles/me/superuser.json';

const siteBaseUrl = Cypress.env('siteBaseUrl');

const baseUrl = `${siteBaseUrl}/dashboard/settings/tasks`;

describe('Tasks', () => {
    beforeEach(() => {
        cy.login();
        cy.intercept('GET', '/sockjs-node/**');
        cy.intercept('GET', '/api/profiles/me/**', {
            fixture: 'profiles/me/superuser.json',
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
            cy.intercept('/api/tasks/**', { fixture: 'tasks/empty-list.json' });
            cy.visit(baseUrl);
            const table = cy.get('table');
            table.should('have.length', 1);
        });
        it('should refresh when clicking on refresh Button', () => {
            cy.intercept('/api/tasks/**', {
                fixture: 'tasks/empty-list.json',
            }).as('firstFetch');

            cy.visit(baseUrl);
            cy.wait(['@firstFetch']).then(() => {
                cy.intercept('/api/tasks/**', {
                    fixture: 'tasks/empty-list.json',
                }).as('secondFetch');
                cy.get('#refresh-button').click();
                cy.wait(['@secondFetch']);
            });
        });
        it('should render results', () => {
            cy.intercept('/api/tasks/**', { fixture: 'tasks/list.json' });
            cy.visit(baseUrl);

            const table = cy.get('table');
            table.should('have.length', 1);
            const rows = table.find('tbody').find('tr');
            rows.should('have.length', 10);
            rows.eq(0).find('td').should('have.length', 8);
        });
        it('should be able to kill a task', () => {
            cy.intercept('/api/tasks/**', { fixture: 'tasks/list.json' });
            cy.visit(baseUrl);

            cy.intercept('PATCH', '/api/tasks/**', {
                id: 140,
                created_at: 1639573484.374525,
                started_at: null,
                ended_at: null,
                progress_value: 0,
                end_value: 0,
                launcher: {
                    first_name: 'Oli',
                    last_name: 'Vier',
                    username: 'olethanh',
                },
                result: null,
                status: 'QUEUED',
                name: 'import_gpkg_task',
                should_be_killed: true,
                progress_message: null,
            }).as('patchRequest');

            const table = cy.get('table');
            const row = table.find('tbody').find('tr').eq(1);
            const actionCol = row.find('td').last();
            const killButton = actionCol.find('button');
            killButton.click();
            cy.get('#notistack-snackbar').should('exist');
            cy.wait('@patchRequest');
            cy.get('@patchRequest').its('request.body').should('contain', {
                id: 140,
                should_be_killed: true,
            });
        });
    });
});
