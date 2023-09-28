/// <reference types="cypress" />

import listFixture from '../../fixtures/duplicates/list-paginated.json';
import emptyFixture from '../../fixtures/duplicates/empty.json';
import superUser from '../../fixtures/profiles/me/superuser.json';
import entityTypes from '../../fixtures/entityTypes/list.json';
import formsList from '../../fixtures/forms/list.json';
import teamsList from '../../fixtures/teams/list.json';
import profilesList from '../../fixtures/profiles/list.json';
import { testTablerender } from '../../support/testTableRender';
import { testPagination } from '../../support/testPagination';

const siteBaseUrl = Cypress.env('siteBaseUrl');

const search = 'mario';
const baseUrl = `${siteBaseUrl}/dashboard/entities/duplicates`;

let interceptFlag = false;
const mockPage = (fakeUser = superUser, fixture = listFixture) => {
    cy.login();
    interceptFlag = false;
    cy.intercept('GET', '/sockjs-node/**');
    cy.intercept('GET', '/api/profiles/me/**', fakeUser);
    cy.intercept('GET', '/api/entitytypes/?order=name', entityTypes);
    cy.intercept('GET', '/api/profiles', profilesList);

    cy.intercept(
        'GET',
        '/api/entityduplicates_analyzes/?order=-created_at&limit=1&page=1',
        {
            fixture: 'duplicates/analysis.json',
            time: 1000000,
        },
    );
    cy.intercept(
        'GET',
        '/api/microplanning/teams/?type=TEAM_OF_USERS',
        teamsList,
    );
    cy.intercept(
        'GET',
        // eslint-disable-next-line max-len
        '/api/forms/?all=true&order=name&fields=name%2Cid%2Cpossible_fields',
        formsList,
    );

    cy.intercept('GET', '/api/entityduplicates/**/*', req => {
        interceptFlag = true;
        req.reply({
            statusCode: 200,
            body: fixture,
        });
    }).as('getDuplicates');
};

describe('Duplicate entities list', () => {
    describe('Page', () => {
        it('should redirect to url with pagination params', () => {
            mockPage();
            cy.visit(baseUrl);

            cy.wait('@getDuplicates').then(() => {
                cy.url().should(
                    'eq',
                    `${baseUrl}/accountId/1/order/id/pageSize/20/page/1`,
                );
            });
        });
        it('should not be accessible if user does not have permission', () => {
            mockPage({
                ...superUser,
                permissions: [],
                is_superuser: false,
            });
            cy.visit(baseUrl);
            const errorCode = cy.get('#error-code');
            errorCode.should('contain', '403');
        });
    });

    describe('Search field', () => {
        beforeEach(() => {
            mockPage();
            cy.visit(baseUrl);
        });
        it('should enabled search button', () => {
            cy.wait('@getDuplicates').then(() => {
                cy.get('#search-search').type(search);
                cy.get('[data-test="search-button"]')
                    .invoke('attr', 'disabled')
                    .should('equal', undefined);
            });
        });
    });

    describe('Search button', () => {
        beforeEach(() => {
            mockPage();
            cy.visit(baseUrl);
        });
        it('should be disabled', () => {
            cy.wait('@getDuplicates').then(() => {
                cy.get('[data-test="search-button"]')
                    .invoke('attr', 'disabled')
                    .should('equal', 'disabled');
            });
        });
        it('should be enabled while searching', () => {
            cy.get('#search-search').type(search);
            cy.wait('@getDuplicates').then(() => {
                cy.get('[data-test="search-button"]')
                    .invoke('attr', 'disabled')
                    .should('equal', undefined);
            });
        });
        it('action should deep link search', () => {
            cy.wait('@getDuplicates', { timeout: 10000 }).then(() => {
                cy.get('#search-search').type(search);

                cy.get('[data-test="search-button"]').click();
                cy.url().should('contain', `/search/${search}`);
            });
        });
    });

    describe('Table', () => {
        beforeEach(() => {
            mockPage();
        });
        testTablerender({
            baseUrl,
            rows: listFixture.results.length,
            columns: 6,
            apiKey: 'entityduplicates',
        });
        testPagination({
            baseUrl,
            apiPath: '/api/entityduplicates/',
            apiKey: 'results',
            withSearch: false,
            fixture: listFixture,
            query: {
                order: 'id',
                page: '1',
                limit: '20',
            },
        });
        it('should display buttons on action column', () => {
            cy.visit(baseUrl);
            cy.wait('@getDuplicates').then(() => {
                cy.get('table').as('table');

                let rowIndex = 0;
                cy.get('@table')
                    .find('tbody')
                    .find('tr')
                    .eq(rowIndex)
                    .as('row');
                cy.get('@row').find('td').last().as('actionCol');
                cy.get('@actionCol')
                    .find('button')
                    .as('button')
                    .should('have.length', 1);
                cy.get('@button')
                    .find('a')
                    .should(
                        'have.attr',
                        'href',
                        '/dashboard/entities/duplicates/details/entities/587,110',
                    );
                cy.get('@actionCol')
                    .find('[data-testid="MergeIcon"]')
                    .should('not.exist');
                cy.log('Display already merged button on merged duplicates');
                rowIndex = 1;
                cy.get('@table')
                    .find('tbody')
                    .find('tr')
                    .eq(rowIndex)
                    .as('row');
                cy.get('@row').find('td').last().as('actionCol');
                cy.get('@actionCol').find('button').should('have.length', 1);
                cy.get('@actionCol')
                    .find('[data-testid="MergeIcon"]')
                    .should('exist');
            });
        });
    });

    describe('Api', () => {
        it('should be called with base params', () => {
            mockPage(superUser);
            interceptFlag = false;
            cy.visit(baseUrl);
            cy.wait('@getDuplicates').then(() => {
                cy.wrap(interceptFlag).should('eq', true);
            });
        });
        it('should be called with search params', () => {
            mockPage(superUser);
            cy.visit(baseUrl);
            cy.wait('@getDuplicates').then(() => {
                interceptFlag = false;

                cy.intercept(
                    'GET',
                    '/api/orgunits/treesearch/?&rootsForUser=true&defaultVersion=true&validation_status=all&ignoreEmptyNames=true',
                    {
                        fixture: 'orgunits/list.json',
                    },
                );
                cy.intercept('GET', '/api/entityduplicates/**/*', req => {
                    interceptFlag = true;
                    req.reply({
                        statusCode: 200,
                        body: emptyFixture,
                    });
                }).as('getDuplicateSearch');
                cy.get('#search-search').type(search);
                cy.fillSingleSelect('#submitter_team', 1);
                cy.fillSingleSelect('#form', 0);
                cy.fillMultiSelect('#fields', [0, 1], false);
                cy.fillSingleSelect('#submitter', 1);
                cy.fillSingleSelect('#algorithm', 1);
                cy.fillSingleSelect('#similarity', 1);
                cy.fillMultiSelect('#entity_type', [2, 3], false);
                cy.get('[data-test="start-date"] input').type(20052010);
                cy.get('[data-test="end-date"] input').type(25052010);
                cy.get('#check-box-ignored').check();
                cy.get('#check-box-merged').check();
                cy.fillTreeView('#ou-tree-input', 2, false);

                cy.get('[data-test="search-button"]').click();
                cy.wait('@getDuplicateSearch').then(xhr => {
                    cy.wrap(interceptFlag).should('eq', true);
                    cy.wrap(xhr.request.query).should('deep.equal', {
                        search: 'mario',
                        submitter_team: '26',
                        form: '1',
                        fields: 'first_name,middle_name',
                        submitter: '69',
                        algorithm: 'levenshtein',
                        similarity: '80',
                        entity_type: '7,3',
                        org_unit: '3',
                        start_date: '20-05-2010',
                        end_date: '25-05-2010',
                        ignored: 'true',
                        merged: 'true',
                        order: 'id',
                        page: '1',
                        limit: '20',
                    });
                });
            });
        });
    });
});
