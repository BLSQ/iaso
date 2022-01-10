/// <reference types="cypress" />

import listFixture from '../../fixtures/forms/list.json';
import superUser from '../../fixtures/profiles/me/superuser.json';

const siteBaseUrl = Cypress.env('siteBaseUrl');

const search = 'ZELDA';
const baseUrl = `${siteBaseUrl}/dashboard/forms/list`;

let interceptFlag = false;
let table;
let row;
const gotToPage = (withForms = true, withUser = true) => {
    if (withForms) {
        cy.intercept('GET', '/api/forms/**', {
            fixture: 'forms/list.json',
        });
    }
    if (withUser) {
        cy.intercept('GET', '/api/profiles/me/**', {
            fixture: 'profiles/me/superuser.json',
        });
    }
    cy.visit(baseUrl);
};

describe('Forms', () => {
    describe('page', () => {
        beforeEach(() => {
            cy.login();
        });
        it('click on create button should redirect to fom creation url', () => {
            gotToPage();
            cy.get('#add-button-container').find('button').click();
            cy.url().should(
                'eq',
                `${siteBaseUrl}/dashboard/forms/detail/formId/0`,
            );
        });
        it('click on create button should redirect to fom creation url', () => {
            gotToPage();
            cy.get('#add-button-container').find('button').click();
            cy.url().should(
                'eq',
                `${siteBaseUrl}/dashboard/forms/detail/formId/0`,
            );
        });
        it('page should not be accessible if user does not have permission', () => {
            gotToPage(true, false);
            const fakeUser = {
                ...superUser,
                permissions: [],
                is_superuser: false,
            };
            cy.login();
            cy.intercept('GET', '/api/profiles/me/**', fakeUser);
            cy.visit(baseUrl);
            const errorCode = cy.get('#error-code');
            errorCode.should('contain', '401');
        });
        describe('Search field', () => {
            beforeEach(() => {
                gotToPage();
            });
            it('should enabled search button', () => {
                cy.get('#search-search').type(search);
                cy.get('#search-button')
                    .invoke('attr', 'disabled')
                    .should('equal', undefined);
            });
            it('should deep link search', () => {
                cy.get('#search-search').type(search);
                cy.url().should('eq', `${baseUrl}/search/${search}`);
            });
        });
        describe('Show deleted checkbox', () => {
            beforeEach(() => {
                gotToPage();
            });
            it('should not be checked', () => {
                cy.get('#check-box-showDeleted').should('not.be.checked');
            });
            it('should deep link search', () => {
                cy.get('#check-box-showDeleted').check();
                cy.url().should('eq', `${baseUrl}/showDeleted/true`);
            });
        });
        describe('Search button', () => {
            beforeEach(() => {
                gotToPage();
            });
            it('should be disabled', () => {
                cy.get('#search-button')
                    .invoke('attr', 'disabled')
                    .should('equal', 'disabled');
            });
            it('action should deep link active search', () => {
                cy.get('#search-search').type(search);
                cy.get('#search-button').click();
                cy.url().should(
                    'eq',
                    `${baseUrl}/page/1/search/${search}/searchActive/true`,
                );
            });
        });
        describe('Table', () => {
            it('should render results', () => {
                gotToPage();
                table = cy.get('table');
                table.should('have.length', 1);
                const rows = table.find('tbody').find('tr');
                rows.should('have.length', listFixture.forms.length);
                rows.eq(0).find('td').should('have.length', 9);
            });
            describe('Latest version column', () => {
                it('should display a XML link, XLS link and a version number', () => {
                    gotToPage();
                    table = cy.get('table');
                    row = table.find('tbody').find('tr').eq(0);
                    const latestCol = row.find('td').eq(7);
                    latestCol.should(
                        'contain',
                        listFixture.forms[0].latest_form_version.version_id,
                    );
                    latestCol.find('a').should('have.length', 2);
                });
                it('should be empty if no latest_form_version', () => {
                    gotToPage();
                    table = cy.get('table');
                    row = table.find('tbody').find('tr').eq(1);
                    const latestCol = row.find('td').eq(7);
                    latestCol.should(
                        'not.contain',
                        listFixture.forms[0].latest_form_version.version_id,
                    );
                    latestCol.find('a').should('not.exist');
                });
            });
            describe('Action column', () => {
                it('should display 4 buttons if user has all rights', () => {
                    gotToPage();
                    table = cy.get('table');
                    row = table.find('tbody').find('tr').eq(0);
                    const actionCol = row.find('td').last();
                    actionCol.find('button').should('have.length', 4);
                });
                it('should display 3 buttons if user has iaso_forms permission', () => {
                    gotToPage(true, false);
                    const fakeUser = {
                        ...superUser,
                        permissions: ['iaso_forms'],
                        is_superuser: false,
                    };
                    cy.login();
                    cy.intercept('GET', '/api/profiles/me/**', fakeUser);
                    cy.visit(baseUrl);
                    table = cy.get('table');
                    row = table.find('tbody').find('tr').eq(0);
                    const actionCol = row.find('td').last();
                    actionCol.find('button').should('have.length', 3);
                });
                it('should display 1 buttons if user has iaso_submissions permission', () => {
                    gotToPage(true, false);
                    const fakeUser = {
                        ...superUser,
                        permissions: ['iaso_submissions'],
                        is_superuser: false,
                    };
                    cy.login();
                    cy.intercept('GET', '/api/profiles/me/**', fakeUser);
                    cy.visit(baseUrl);
                    table = cy.get('table');
                    row = table.find('tbody').find('tr').eq(0);
                    const actionCol = row.find('td').last();
                    actionCol.find('button').should('have.length', 1);
                });
            });
        });
        describe('Exports buttons', () => {
            it('should be visible if we have results', () => {
                gotToPage();
                cy.get('#csv-export-button').should('be.visible');
                cy.get('#xlsx-export-button').should('be.visible');
            });
            it("should not be visible if we don't have results", () => {
                gotToPage(true, false);
                cy.intercept('GET', '/api/forms/**', {
                    fixture: 'forms/empty.json',
                });
                cy.visit(baseUrl);
                cy.get('#csv-export-button').should('not.exist');
                cy.get('#xlsx-export-button').should('not.exist');
            });
        });
    });

    describe('api', () => {
        it('should be called with base params', () => {
            interceptFlag = false;
            cy.login();
            cy.intercept(
                {
                    pathname: '/api/forms/**',
                    query: {
                        order: 'instance_updated_at',
                        all: 'true',
                        limit: '50',
                    },
                },
                req => {
                    req.continue(res => {
                        interceptFlag = true;
                        res.send({ fixture: 'forms/empty.json' });
                    });
                },
            ).as('getForms');
            gotToPage(false);
            cy.wait('@getForms').then(() => {
                cy.wrap(interceptFlag).should('eq', true);
            });
        });
        it('should be called with search params', () => {
            interceptFlag = false;
            cy.login();
            cy.intercept(
                {
                    pathname: '/api/forms/**',
                    query: {
                        order: 'instance_updated_at',
                        page: '1',
                        search,
                        showDeleted: 'true',
                        searchActive: 'true',
                        all: 'true',
                        limit: '50',
                    },
                },
                req => {
                    req.continue(res => {
                        interceptFlag = true;
                        res.send({ fixture: 'forms/empty.json' });
                    });
                },
            ).as('getFormsSearch');
            gotToPage(false);
            cy.get('#search-search').type(search);
            cy.get('#check-box-showDeleted').check();
            cy.get('#search-button').click();
            cy.wait('@getFormsSearch').then(() => {
                cy.wrap(interceptFlag).should('eq', true);
            });
        });
    });
});
