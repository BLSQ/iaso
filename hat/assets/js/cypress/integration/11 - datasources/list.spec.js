/// <reference types='cypress' />

import superUser from '../../fixtures/profiles/me/superuser.json';
import {
    makeDataSourcesFromSeed,
    makeSourceVersionsFromSeed,
    defaultProject,
    makePaginatedResponse,
} from '../../support/dummyData';
import { testPagination } from '../../support/testPagination';
import { testPermission } from '../../support/testPermission';
import { testTablerender } from '../../support/testTableRender';
import { testTopBar } from '../../support/testTopBar';
import orgUnitTypes from '../../fixtures/orgunittypes/dummy-list.json';

const siteBaseUrl = Cypress.env('siteBaseUrl');

const baseUrl = `${siteBaseUrl}/dashboard/orgunits/sources/list/pageSize/10/page/1`;

const dataSourceSeeds = Array(11)
    .fill()
    .map((_el, index) => ({
        id: index + 1,
        name: `datasource-${index + 1}`,
        versions: 3,
        defaultVersion: index % 2 > 0 ? 1 : null,
    }));

const sourceVersions = makeSourceVersionsFromSeed(dataSourceSeeds);
const datasources = makeDataSourcesFromSeed(
    dataSourceSeeds,
    sourceVersions.versions,
);
const projects = {
    projects: [defaultProject],
};

const sourcesPage1 = makePaginatedResponse({
    hasPrevious: false,
    hasNext: true,
    page: 1,
    pages: 2,
    limit: 20,
    count: 21,
    data: datasources.sources.slice(0, 10),
    dataKey: 'sources',
});
const sourcesPage2 = makePaginatedResponse({
    hasPrevious: true,
    hasNext: false,
    page: 2,
    pages: 2,
    limit: 20,
    count: 21,
    data: datasources.sources.slice(10, 11),
    dataKey: 'sources',
});

describe('Data sources', () => {
    beforeEach(() => {
        cy.login();
        cy.intercept('GET', '/api/orgunittypes/', orgUnitTypes).as(
            'orgUnitTypes',
        );
        cy.intercept('GET', '/api/projects/', projects).as('projects');
        cy.intercept('GET', '/api/datasources/', datasources).as(
            'allDatasources',
        );
        cy.intercept('GET', '/api/sourceversions/', sourceVersions).as(
            'sourceVersions',
        );
        cy.intercept(
            'GET',
            '/api/datasources/?&limit=10&page=1&order=name',
            sourcesPage1,
        ).as('page1');
        cy.intercept(
            'GET',
            '/api/datasources/?&limit=10&page=2&order=name',
            sourcesPage2,
        ).as('page2');
        cy.intercept('GET', '/api/profiles/me/**', superUser);
    });
    describe('When mounting', () => {
        testPermission(baseUrl);
        testTopBar(baseUrl, 'Data Sources', false);
        // This test is not trustworthy, a sthe component is still in loading state at the end of it
        testTablerender({
            baseUrl,
            rows: 10,
            columns: 6,
            apiKey: 'datasources',
        });
        describe('"Create" button', () => {
            beforeEach(() => {
                cy.visit(baseUrl);
                cy.wait('@page1');
                cy.get('[data-test=create-datasource-button]').as(
                    'create-button',
                );
            });
            it('exists', () => {
                cy.get('@create-button').should('exist');
            });
            it('opens modal', () => {
                cy.get('@create-button')
                    .click()
                    .then(() => {
                        cy.getAndAssert(
                            '[data-test=datasource-modal]',
                            'modal',
                        );
                    });
            });
            it('has all modal fields empty', () => {
                cy.get('@create-button')
                    .click()
                    .then(() => {
                        // TODO test checkbox
                        // TODO replace ids with data-test in blsq-comp

                        cy.get('[data-test=datasource-modal]')
                            .as('modal')
                            .then(() => {
                                cy.testInputValue('#input-text-name', '');
                                cy.testInputValue(
                                    '#input-text-description',
                                    undefined,
                                );
                                cy.testInputValue('#input-text-dhis_name', '');
                                cy.testInputValue('#input-text-dhis_url', '');
                                cy.testInputValue('#input-text-dhis_login', '');
                                cy.testInputValue(
                                    '#input-text-dhis_password',
                                    '',
                                );
                                cy.testMultiSelect('#project_ids', []);
                            });
                    });
            });
        });
    });
    describe('Copy Version', () => {
        beforeEach(() => {
            cy.visit(baseUrl);
        });
        describe('When user copies in same datasource and goes to Task', () => {
            it('opens CopyVersion modal', () => {
                // cy.wait('@page1');
                // cy.wait('@allDatasources');
                // cy.wait('@sourceVersions');
                // cy.wait('@orgUnitTypes');
                cy.get('[data-test=open-versions-dialog-button-1]')
                    .as('openVersionsButton')
                    .click();
                cy.getAndAssert(
                    '[data-test=copyversion-button]',
                    'copyVersionButton',
                );
                cy.get('@copyVersionButton').first().click();
                cy.getAndAssert('#destinationSource').should(
                    'have.value',
                    'datasource-1',
                );

                cy.getAndAssert(
                    '[data-test=copy-source-version-modal] h2',
                    'modal-title',
                ).should('have.text', 'Copy datasource-1 version 0 ?');

                // Move table test in another test
                // testTablerender({
                //     baseUrl,
                //     rows: 4,
                //     columns: 6,
                //     apiKey: 'sourceversions',
                // });
            });
            it('displays correct warning message', () => {
                cy.get('[data-test=open-versions-dialog-button-1]')
                    .as('openVersionsButton')
                    .click();
                cy.getAndAssert(
                    '[data-test=copyversion-button]',
                    'copyVersionButton',
                );
                cy.get('@copyVersionButton').first().click();
                cy.get('[data-test=copyversion-warning-datasource-1]')
                    .as('warningMessage')
                    .should(
                        'have.text',
                        'datasource-1 - version 0 will be copied to datasource-1 - version 4 ',
                    );
            });
            it('makes API call and redirects to Tasks page', () => {
                const body = {
                    destination_source_id: 1,
                    destination_version_number: '4',
                    force: false,
                    source_source_id: 1,
                    source_version_number: 0,
                };
                cy.intercept('POST', '/api/copyversion').as('copy');
                cy.get('[data-test=open-versions-dialog-button-1]')
                    .as('openVersionsButton')
                    .click();
                cy.getAndAssert(
                    '[data-test=copyversion-button]',
                    'copyVersionButton',
                );
                cy.get('@copyVersionButton').first().click();
                cy.getAndAssert(
                    '[data-test=additional-button]',
                    'launchTaskButton',
                ).click();
                cy.wait('@copy').its('request.body').as('request');
                cy.get('@request').its('destination_source_id').should('eq', 1);
            });
        });
    });
    describe.skip("'Create' modal", () => {
        it.skip('Sends correct data to API', () => {});
        it.skip('Empties fields on cancel', () => {});
        it.skip('Empties fields on Save', () => {});
        it.skip('Closes on save and on cancel', () => {});
    });
});
