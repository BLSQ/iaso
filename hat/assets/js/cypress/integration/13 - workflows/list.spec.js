/// <reference types="cypress" />

import { testTablerender } from '../../support/testTableRender';
import { testPagination } from '../../support/testPagination';

import superUser from '../../fixtures/profiles/me/superuser.json';
import page2 from '../../fixtures/workflows/page2.json';
import listFixture from '../../fixtures/workflows/list.json';

const siteBaseUrl = Cypress.env('siteBaseUrl');

const baseUrl = `${siteBaseUrl}/dashboard/workflows/entityTypeId/3/order/-id/pageSize/10/page/1`;

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
};
const search = 'mario';
const name = 'Peach';
let interceptFlag = false;

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
    });
    it('Search field should enabled search button', () => {
        mockPage();
        cy.visit(baseUrl);
        cy.get('#search-search').type(search);
        cy.get('[data-test="search-button"]')
            .invoke('attr', 'disabled')
            .should('equal', undefined);
    });
    describe('Search button', () => {
        beforeEach(() => {
            mockPage();
            cy.visit(baseUrl);
        });
        it('should be disabled', () => {
            cy.get('[data-test="search-button"]')
                .invoke('attr', 'disabled')
                .should('equal', 'disabled');
        });
        it('action should deep link search and call ai with same params', () => {
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
    });

    describe.only('Create button', () => {
        beforeEach(() => {
            mockPage();
            cy.visit(baseUrl);
        });
        it('should open dialog with empty field', () => {
            cy.get('[data-test="add-workflow-version-button"]').click();
            cy.get('[data-test="add-workflow-version"]').should('be.visible');
            cy.testInputValue('#input-text-name', '');
        });
        it('should save new workflow version', () => {
            cy.get('[data-test="add-workflow-version-button"]').click();
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
                cy.wrap(xhr.request.body)
                    .its('entity_type_id')
                    .should('eq', '3');
                cy.wrap(interceptFlag).should('eq', true);
            });
        });
    });
    describe.skip('Copy action', () => {});
    describe.skip('Publish action', () => {});
    describe.skip('Unpublish action', () => {});
});
