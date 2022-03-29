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
    describe.skip("'Create' modal", () => {
        it.skip('Sends correct data to API', () => {});
        it.skip('Empties fields on cancel', () => {});
        it.skip('Empties fields on Save', () => {});
        it.skip('Closes on save and on cancel', () => {});
    });
});
