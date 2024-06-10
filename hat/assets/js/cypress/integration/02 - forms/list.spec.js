/// <reference types="cypress" />

import * as Permission from '../../../apps/Iaso/utils/permissions.ts';
import { search, searchWithForbiddenChars } from '../../constants/search';
import listFixture from '../../fixtures/forms/list.json';
import superUser from '../../fixtures/profiles/me/superuser.json';
import { testSearchField } from '../../support/testSearchField';
import { testTablerender } from '../../support/testTableRender';
import { testTopBar } from '../../support/testTopBar';

const siteBaseUrl = Cypress.env('siteBaseUrl');

const baseUrl = `${siteBaseUrl}/dashboard/forms/list`;

let interceptFlag = false;
let table;
let row;
const goToPage = (
    fakeUser = superUser,
    urlParams,
    fixture = 'forms/list.json',
) => {
    cy.login();
    interceptFlag = false;
    cy.intercept('GET', '/sockjs-node/**');
    cy.intercept('GET', '/api/profiles/me/**', fakeUser);
    // TODO remove times: 2 cf hat/assets/js/apps/Iaso/components/tables/SingleTable.js l 80
    cy.intercept('GET', '/api/forms/**', {
        fixture,
        times: 2,
    }).as('getForms');

    cy.intercept('GET', '/api/v2/orgunittypes/**', {
        fixture: 'orgunittypes/list.json',
    }).as('getTypes');
    cy.intercept('GET', '/api/projects/**', {
        fixture: 'projects/list.json',
    }).as('getProject');
    cy.intercept('GET', '/dashboard/media/forms/*.xls').as('downloadXls');
    cy.intercept('GET', '/dashboard/media/forms/*.xml').as('downloadXml');
    const urlToVisit = urlParams ? `${baseUrl}${urlParams}` : baseUrl;
    cy.visit(urlToVisit);
};

describe('Forms', () => {
    describe('page', () => {
        it('page should not be accessible if user does not have permission', () => {
            goToPage({
                ...superUser,
                permissions: [],
                is_superuser: false,
            });
            const errorCode = cy.get('#error-code');
            errorCode.should('contain', 'Awaiting Access Permissions');
        });

        it('click on create button should redirect to form creation url', () => {
            goToPage();
            cy.get('[data-test=add-form-button]').click();
            cy.url().should(
                'eq',
                `${siteBaseUrl}/dashboard/forms/detail/accountId/1/formId/0`,
            );
        });
        describe('Top bar and table', () => {
            beforeEach(() => {
                goToPage(superUser);
            });
            testTopBar(baseUrl, 'Forms', false);
            testTablerender({
                baseUrl,
                rows: 11,
                columns: 10,
                apiKey: 'forms',
            });
        });
        describe('Create button', () => {
            it("is hidden if user doesn't have 'forms' permission", () => {
                const fakeUser = {
                    ...superUser,
                    permissions: [
                        Permission.SUBMISSIONS,
                        Permission.SUBMISSIONS_UPDATE,
                    ],
                    is_superuser: false,
                };
                goToPage(fakeUser);
                cy.get('[data-test="add-form-button"]').should('not.exist');
            });
            it("is visible if user has 'forms' permission", () => {
                const fakeUser = {
                    ...superUser,
                    permissions: [Permission.FORMS],
                    is_superuser: false,
                };
                goToPage(fakeUser);
                cy.get('[data-test="add-form-button"]').should('exist').click();
                // check that button redirects to creation page
                cy.url().should(
                    'eq',
                    `${siteBaseUrl}/dashboard/forms/detail/accountId/1/formId/0`,
                );
            });
        });
        describe('Search field', () => {
            beforeEach(() => {
                goToPage();
            });
            testSearchField(search, searchWithForbiddenChars);
        });
        describe('Show deleted checkbox', () => {
            beforeEach(() => {
                goToPage();
            });
            it('should not be checked', () => {
                cy.get('#check-box-showDeleted').should('not.be.checked');
            });
        });
        describe('Search button', () => {
            beforeEach(() => {
                goToPage();
            });
            it('should be disabled', () => {
                cy.get('[data-test="search-button"]')
                    .invoke('attr', 'disabled')
                    .should('equal', 'disabled');
            });
            it('action should deep link active search', () => {
                cy.get('#search-search').type(search);
                cy.get('[data-test="search-button"]').click();
                cy.url().should(
                    'eq',
                    `${siteBaseUrl}/dashboard/forms/list/accountId/1/page/1/search/${search}`,
                );
            });
        });
        describe('Table', () => {
            it('should render results', () => {
                goToPage();
                table = cy.get('table');
                table.should('have.length', 1);
                const rows = table.find('tbody').find('tr');
                rows.should('have.length', listFixture.forms.length);
                rows.eq(0).find('td').should('have.length', 10);
            });
            describe('Latest version column', () => {
                beforeEach(() => {
                    goToPage();
                });
                it('should display a XML link, XLS link and a version number', () => {
                    table = cy.get('table');
                    row = table.find('tbody').find('tr').eq(0);
                    const latestCol = row.find('td').eq(8);
                    latestCol.should(
                        'contain',
                        listFixture.forms[0].latest_form_version.version_id,
                    );
                    latestCol.find('a').as('links').should('have.length', 2);
                    // TODO Find a way to test file download
                });
                it('should be empty if no latest_form_version', () => {
                    table = cy.get('table');
                    row = table.find('tbody').find('tr').eq(1);
                    const latestCol = row.find('td').eq(8);
                    latestCol.should(
                        'not.contain',
                        listFixture.forms[0].latest_form_version.version_id,
                    );
                    latestCol.find('a').should('not.exist');
                });
            });
            describe('Action column', () => {
                it('should display 4 buttons if user has all rights', () => {
                    goToPage();
                    table = cy.get('table');
                    row = table.find('tbody').find('tr').eq(0);
                    const actionCol = row.find('td').last();
                    actionCol.find('button').should('have.length', 5);
                });
                it('should display 3 buttons if user has iaso_forms permission', () => {
                    goToPage({
                        ...superUser,
                        permissions: [Permission.FORMS],
                        is_superuser: false,
                    });
                    table = cy.get('table');
                    row = table.find('tbody').find('tr').eq(0);
                    const actionCol = row.find('td').last();
                    actionCol.find('button').should('have.length', 3);
                });
                it('should display 1 buttons if user has iaso_submissions permission', () => {
                    goToPage({
                        ...superUser,
                        permissions: [Permission.SUBMISSIONS],
                        is_superuser: false,
                    });
                    table = cy.get('table');
                    row = table.find('tbody').find('tr').eq(0);
                    const actionCol = row.find('td').last();
                    actionCol.find('button').should('have.length', 1);
                });
            });
        });
        describe('Exports buttons', () => {
            it('should be visible if we have results', () => {
                goToPage(superUser, null, 'forms/list.json');
                cy.wait('@getForms').then(() => {
                    cy.get('[data-test="csv-export-button"]')
                        .as('csvButton')
                        .should('be.visible');
                    cy.get('[data-test="xlsx-export-button"]')
                        .as('xlsxButton')
                        .should('be.visible');
                });
            });
            it("should not be visible if we don't have results", () => {
                goToPage(superUser, null, 'forms/empty.json');
                cy.wait('@getForms').then(() => {
                    cy.get('[data-test="csv-export-button"]').should(
                        'not.exist',
                    );
                    cy.get('[data-test="xlsx-export-button"]').should(
                        'not.exist',
                    );
                });
            });
        });
    });

    describe('api', () => {
        it('should be called with base params', () => {
            goToPage(
                superUser,
                '/order/instance_updated_at/all/true/limit/50/',
                'forms/empty.json',
            );
            cy.intercept(
                {
                    method: 'GET',
                    pathname: '/api/forms/**',
                    times: 2,
                    query: {
                        order: 'instance_updated_at',
                        all: 'true',
                        limit: '50',
                    },
                },
                req => {
                    req.on('response', response => {
                        if (response.statusMessage === 'OK') {
                            response.send({ fixture: 'forms/empty.json' });
                        }
                    });
                },
            ).as('getFormsWithParams');
            cy.wait('@getFormsWithParams');
        });
        it('should be called with search params', () => {
            goToPage(superUser, null, 'forms/list.json');
            cy.wait('@getForms').then(() => {
                interceptFlag = false;
                cy.intercept(
                    'GET',
                    // Stubbing the exact url to avoid bugs with intercepts on the same base url
                    '/api/forms/?&order=instance_updated_at&page=1&search=ZELDA&showDeleted=true&orgUnitTypeIds=47,11&projectsIds=1,2&all=true&limit=50',
                    req => {
                        req.continue(res => {
                            interceptFlag = true;
                            res.send({ fixture: 'forms/list.json' });
                        });
                    },
                ).as('getFormSearch');

                cy.get('#search-search').type(search);
                cy.fillMultiSelect('#orgUnitTypeIds', [0, 1], false);
                cy.fillMultiSelect('#projectsIds', [0, 1], false);
                cy.get('#check-box-showDeleted').check();

                cy.get('[data-test="search-button"]').click();

                cy.wait('@getFormSearch').then(xhr => {
                    cy.wrap(interceptFlag).should('eq', true);
                    cy.log('query', xhr.request.query);
                    cy.wrap(xhr.request.query).should('deep.equal', {
                        all: 'true',
                        limit: '50',
                        order: 'instance_updated_at',
                        orgUnitTypeIds: '47,11',
                        page: '1',
                        projectsIds: '1,2',
                        search: 'ZELDA',
                        showDeleted: 'true',
                    });
                });
            });
        });
    });
});
