/// <reference types="cypress" />

import * as Permission from '../../../apps/Iaso/utils/permissions.ts';
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
            cy.get('#error-code').should('contain', '403');
        });
    });
    describe('Table', () => {
        it('should work on empty results', () => {
            cy.intercept('/api/tasks/**', { fixture: 'tasks/empty-list.json' });
            cy.visit(baseUrl);
            cy.get('table').should('have.length', 1);
        });
        it('should refresh when clicking on refresh Button', () => {
            cy.intercept('/api/tasks/**', {
                fixture: 'tasks/empty-list.json',
            }).as('firstFetch');

            cy.visit(baseUrl);
            cy.wait('@firstFetch').then(() => {
                cy.intercept('/api/tasks/**', {
                    fixture: 'tasks/empty-list.json',
                }).as('secondFetch');
                cy.wait(1000); // wait for 1 second
                cy.get('#refresh-button').click();
                cy.wait('@secondFetch');
            });
        });
        it('should render results', () => {
            cy.intercept('/api/tasks/**', { fixture: 'tasks/list.json' });
            cy.visit(baseUrl);

            cy.get('table').should('have.length', 1);
            cy.get('table').find('tbody').find('tr').should('have.length', 12);
            cy.get('table')
                .find('tbody')
                .find('tr')
                .eq(0)
                .find('td')
                .should('have.length', 9);
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

            cy.get('table')
                .find('tbody')
                .find('tr')
                .eq(1)
                .find('td')
                .last()
                .prev()
                .find('button')
                .click();
            cy.get('#notistack-snackbar').should('exist');
            cy.wait('@patchRequest');
            cy.get('@patchRequest').its('request.body').should('contain', {
                id: 140,
                should_be_killed: true,
            });
        });
    });
    describe('Polio notifications import tasks', () => {
        let modal;
        let openModalBtn;

        beforeEach(() => {
            cy.intercept('/api/tasks/**', { fixture: 'tasks/list.json' });
            openModalBtn =
                '[data-test="open-polio-notifications-import-details-button"]';
            modal = '#polio-notifications-import-details-modal';
        });

        it('modals buttons should not be rendered if user does not have the right Polio permission', () => {
            const fakeUser = {
                ...superUser,
                permissions: [Permission.DATA_TASKS],
                is_superuser: false,
            };
            cy.intercept('GET', '/api/profiles/me/**', fakeUser);
            cy.visit(baseUrl);
            cy.get('table').should('have.length', 1);
            cy.get('table').find('tbody').find('tr').should('have.length', 12);
            cy.get(openModalBtn).should('have.length', 0);
        });

        it('opens a modal containing a Polio Notifications Import', () => {
            cy.intercept('/api/polio/notifications/**', {
                fixture: 'tasks/polio_notification_import.json',
            });
            cy.visit(baseUrl);
            cy.get(openModalBtn)
                .should('have.length', 2)
                .eq(0)
                .click()
                .then(() => {
                    cy.getAndAssert(modal, 'modal');
                    cy.getAndAssert(`${modal} h2`).should(
                        'have.text',
                        'Polio Notifications Import Details',
                    );
                    cy.getAndAssert(`${modal} p`).should(
                        'have.text',
                        '1 polio notifications created.',
                    );
                });
        });

        it('opens a modal containing a Polio Notifications Import with errors', () => {
            cy.intercept('/api/polio/notifications/**', {
                fixture: 'tasks/polio_notification_import_with_errors.json',
            });
            cy.visit(baseUrl);
            cy.get(openModalBtn)
                .should('have.length', 2)
                .eq(1)
                .click()
                .then(() => {
                    cy.getAndAssert(modal, 'modal');
                    cy.getAndAssert(`${modal} h2`).should(
                        'have.text',
                        'Polio Notifications Import Details',
                    );
                    cy.getAndAssert(`${modal} pre`).should(
                        'contain.text',
                        '"COUNTRY": "CHAD"',
                    );
                });
        });
    });
});
