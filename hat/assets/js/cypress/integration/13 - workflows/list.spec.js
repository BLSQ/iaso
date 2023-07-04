/// <reference types="cypress" />

import { testTablerender } from '../../support/testTableRender';
import { testPagination } from '../../support/testPagination';

import superUser from '../../fixtures/profiles/me/superuser.json';
import page2 from '../../fixtures/workflows/page2.json';
import listFixture from '../../fixtures/workflows/list.json';
import { testSearchField } from '../../support/testSearchField';
import { search, searchWithForbiddenChars } from '../../constants/search';

const siteBaseUrl = Cypress.env('siteBaseUrl');
const baseUrl = `${siteBaseUrl}/dashboard/workflows/entityTypeId/3/order/-id/pageSize/10/page/1`;

const name = 'Peach';
let interceptFlag = false;

const mockPage = () => {
    cy.login();
    cy.intercept('GET', '/sockjs-node/**');
    cy.intercept('GET', '/api/profiles/me/**', {
        fixture: 'profiles/me/superuser.json',
    });
    cy.intercept('GET', '/api/workflowversions/**/*', {
        fixture: 'workflows/list.json',
    });
    cy.intercept('GET', '/api/entitytype/3', {
        fixture: 'entityTypes/list.json',
    });
    cy.visit(baseUrl);
};

const getActionCellButton = (rowIndex, buttonIndex) => {
    cy.get('table tbody tr').eq(rowIndex).find('td').last().as('actionCell');
    cy.get('@actionCell').find('button').eq(buttonIndex).as('actionButton');
};

describe('Workflows', () => {
    it('page should not be accessible if user does not have permission', () => {
        const fakeUser = {
            ...superUser,
            permissions: [],
            is_superuser: false,
        };
        mockPage();
        cy.intercept('GET', '/api/profiles/me/**', fakeUser);
        cy.visit(baseUrl);
        const errorCode = cy.get('#error-code');
        errorCode.should('contain', '401');
    });

    describe('Search field', () => {
        beforeEach(() => {
            mockPage();
        });
        testSearchField(search, searchWithForbiddenChars);
    });

    describe('Table', () => {
        beforeEach(() => {
            mockPage();
            cy.intercept(
                {
                    pathname: '/api/workflowversions/',
                    query: {
                        order: '-id',
                        page: '2',
                        limit: '10',
                        workflow__entity_type: '3',
                    },
                },
                page2,
            );
        });
        testTablerender({
            baseUrl,
            rows: 10,
            columns: 4,
            apiKey: 'workflow_versions',
            apiPath: 'workflowversions/**/*',
        });
        testPagination({
            baseUrl,
            apiPath: '/api/workflowversions/',
            apiKey: 'workflow_versions',
            withSearch: false,
            fixture: listFixture,
            query: {
                order: '-id',
                page: '1',
                limit: '10',
                workflow__entity_type: '3',
            },
        });
        describe('Actions', () => {
            beforeEach(() => {
                mockPage();
                cy.visit(baseUrl);
            });

            describe('Buttons', () => {
                it('Delete should only be present on DRAFT version', () => {
                    cy.get('table tbody tr')
                        .eq(0)
                        .find('td')
                        .eq(2)
                        .should('contain', 'Draft');

                    cy.get(
                        '[data-test="delete-dialog-button-workflow-version-12"]',
                    ).should('be.visible');

                    cy.get('table tbody tr')
                        .eq(1)
                        .find('td')
                        .eq(2)
                        .should('contain', 'Published');

                    cy.get(
                        '[data-test="delete-dialog-button-workflow-version-11"]',
                    ).should('not.exist');
                });
                it('Publish and Copy should only be present on DRAFT or UNPUBLISHED version', () => {
                    cy.get('table tbody tr')
                        .eq(0)
                        .find('td')
                        .eq(2)
                        .should('contain', 'Draft');
                    cy.get('[data-test="publish-button-12"]').should(
                        'be.visible',
                    );

                    cy.get('table tbody tr')
                        .eq(1)
                        .find('td')
                        .eq(2)
                        .should('contain', 'Published');

                    cy.get('[data-test="publish-button-11"]').should(
                        'not.exist',
                    );

                    cy.get('table tbody tr')
                        .eq(2)
                        .find('td')
                        .eq(2)
                        .should('contain', 'Unpublished');

                    cy.get('[data-test="publish-button-10"]').should(
                        'be.visible',
                    );
                    cy.get('table tbody tr')
                        .eq(0)
                        .find('td')
                        .eq(2)
                        .should('contain', 'Draft');

                    cy.get('[data-test="copy-button-12"]').should('not.exist');

                    cy.get('table tbody tr')
                        .eq(2)
                        .find('td')
                        .eq(2)
                        .should('contain', 'Unpublished');

                    cy.get('[data-test="copy-button-10"]').should('be.visible');

                    cy.get('table tbody tr')
                        .eq(1)
                        .find('td')
                        .eq(2)
                        .should('contain', 'Published');

                    cy.get('[data-test="copy-button-11"]').should('be.visible');
                });
            });
            it('Copy should call api with correct params', () => {
                interceptFlag = false;
                cy.intercept(
                    {
                        method: 'POST',
                        pathname: '/api/workflowversions/11/copy/',
                    },
                    req => {
                        interceptFlag = true;
                        req.reply({
                            statusCode: 200,
                            body: {},
                        });
                    },
                ).as('copyVersion');
                getActionCellButton(1, 1);
                cy.get('@actionButton').click();
                cy.wait('@copyVersion').then(() => {
                    cy.wrap(interceptFlag).should('eq', true);
                });
            });

            it('Publish should open dialog and call api with correct params', () => {
                interceptFlag = false;
                cy.intercept(
                    {
                        method: 'PATCH',
                        pathname: '/api/workflowversions/10/',
                    },
                    req => {
                        interceptFlag = true;
                        req.reply({
                            statusCode: 200,
                            body: {},
                        });
                    },
                ).as('publishVersion');
                getActionCellButton(2, 2);
                cy.get('@actionButton').click();
                cy.get('[data-test="publish-workflow-version"]').should(
                    'be.visible',
                );

                cy.get('[data-test="confirm-button"]').click();
                cy.wait('@publishVersion').then(xhr => {
                    cy.wrap(xhr.request.body)
                        .its('status')
                        .should('eq', 'PUBLISHED');
                    cy.wrap(interceptFlag).should('eq', true);
                });
            });

            it('Unpublish should call api with correct params', () => {
                interceptFlag = false;
                cy.intercept(
                    {
                        method: 'PATCH',
                        pathname: '/api/workflowversions/11/',
                    },
                    req => {
                        interceptFlag = true;
                        req.reply({
                            statusCode: 200,
                            body: {},
                        });
                    },
                ).as('unPublishVersion');
                getActionCellButton(1, 2);
                cy.get('@actionButton').click();
                cy.wait('@unPublishVersion').then(xhr => {
                    cy.wrap(xhr.request.body)
                        .its('status')
                        .should('eq', 'UNPUBLISHED');
                    cy.wrap(interceptFlag).should('eq', true);
                });
            });

            it('Delete should open dialog and call api with correct params', () => {
                interceptFlag = false;
                cy.intercept(
                    {
                        method: 'DELETE',
                        pathname: '/api/workflowversions/12/',
                    },
                    req => {
                        interceptFlag = true;
                        req.reply({
                            statusCode: 200,
                            body: {},
                        });
                    },
                ).as('deleteVersion');
                getActionCellButton(0, 1);
                cy.get('@actionButton').click();
                cy.get(
                    '[data-test="delete-dialog-workflow-version-12"]',
                ).should('be.visible');

                cy.get('[data-test="confirm-button"]').click();
                cy.wait('@deleteVersion').then(() => {
                    cy.wrap(interceptFlag).should('eq', true);
                });
            });
        });
    });

    it('Filter button action should deep link search and call api with same params', () => {
        mockPage();
        cy.visit(baseUrl);
        cy.get('[data-test="search-button"]')
            .invoke('attr', 'disabled')
            .should('equal', 'disabled');
        interceptFlag = false;
        cy.intercept(
            {
                method: 'GET',
                pathname: '/api/workflowversions/',
                query: {
                    search,
                    status: 'DRAFT',
                    order: '-id',
                    page: '1',
                    limit: '10',
                    workflow__entity_type: '3',
                },
            },
            req => {
                interceptFlag = true;
                req.reply({
                    statusCode: 200,
                    body: listFixture,
                });
            },
        ).as('getVersions');
        cy.get('#search-search').type(search);
        cy.fillSingleSelect('#status', 0);
        cy.get('[data-test="search-button"]').click();
        cy.url().should('contain', `/search/${search}`);
        cy.url().should('contain', '/status/DRAFT');

        cy.wait('@getVersions').then(() => {
            cy.wrap(interceptFlag).should('eq', true);
        });
    });

    it('Create button should open dialog with empty field and save new workflow version', () => {
        mockPage();
        cy.visit(baseUrl);
        cy.get('[data-test="add-workflow-version-button"]').click();
        cy.get('[data-test="add-workflow-version"]').should('be.visible');
        cy.testInputValue('#input-text-name', '');
        cy.get('[data-test="confirm-button"]').as('confirmButton');
        cy.get('@confirmButton')
            .invoke('attr', 'disabled')
            .should('equal', 'disabled');
        cy.fillTextField('#input-text-name', name);
        cy.get('@confirmButton')
            .invoke('attr', 'disabled')
            .should('equal', undefined);

        interceptFlag = false;

        cy.intercept(
            {
                method: 'POST',
                pathname: '/api/workflowversions/',
            },
            req => {
                interceptFlag = true;
                req.reply({
                    statusCode: 200,
                    body: {},
                });
            },
        ).as('createVersion');

        cy.get('@confirmButton').click();
        cy.wait('@createVersion').then(xhr => {
            cy.wrap(xhr.request.body).its('name').should('eq', name);
            cy.wrap(xhr.request.body).its('entity_type_id').should('eq', '3');
            cy.wrap(interceptFlag).should('eq', true);
        });
    });
});
