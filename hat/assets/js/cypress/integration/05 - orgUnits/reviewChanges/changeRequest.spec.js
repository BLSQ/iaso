/// <reference types="cypress" />
import moment from 'moment';
import superUser from '../../../fixtures/profiles/me/superuser.json';
import listFixture from '../../../fixtures/orgunits/changes/orgUnitChanges.json';
import page2 from '../../../fixtures/orgunits/changes/orgUnitChanges-page2.json';
import emptyFixture from '../../../fixtures/orgunits/changes/empty.json';
import { testTablerender } from '../../../support/testTableRender';
import { testPagination } from '../../../support/testPagination';
import { testTableSort } from '../../../support/testTableSort';
import { testPageFilters } from '../../../support/testPageFilters';

const siteBaseUrl = Cypress.env('siteBaseUrl');
const baseUrl = `${siteBaseUrl}/dashboard/orgunits/changeRequest`;

let interceptFlag = false;
let table;
let row;
const defaultQuery = {
    limit: '10',
    order: '-updated_at',
};
const newFilters = {
    groups: {
        value: [0],
        urlValue: '1',
        selector: '#groups',
        type: 'multi',
        clear: false,
    },
    forms: {
        value: [0],
        urlValue: '1',
        selector: '#forms',
        type: 'multi',
        clear: false,
    },
    parent_id: {
        value: 2,
        urlValue: '29681',
        selector: '#ou-tree-input',
        type: 'tree',
    },
    org_unit_type_id: {
        value: [0],
        urlValue: '47',
        selector: '#org_unit_type_id',
        type: 'multi',
        clear: false,
    },
    withLocation: {
        value: [0],
        urlValue: 'true',
        selector: '#withLocation',
        type: 'multi',
        clear: false,
    },
    created_at_after: {
        value: '10032022',
        urlValue: '10-03-2022',
        apiValue: '2022-03-10 00:00',
        selector: '[data-test="start-date"] input',
        type: 'text',
    },
    created_at_before: {
        value: '10032023',
        urlValue: '10-03-2023',
        apiValue: '2023-03-10 23:59',
        selector: '[data-test="end-date"] input',
        type: 'text',
    },
    userRoles: {
        value: [0],
        urlValue: '13',
        selector: '#userRoles',
        type: 'multi',
        clear: false,
    },
    status: {
        value: [0],
        urlValue: 'new',
        selector: '#status',
        type: 'multi',
        clear: false,
    },
};
const openDialogForChangeRequestIndex = index => {
    table = cy.get('table');
    row = table.find('tbody').find('tr').eq(index);
    const actionCol = row.find('td').eq(10);
    const editButton = actionCol.find('button').first();
    editButton.click();
    cy.get('#approve-orgunit-changes-dialog').should('be.visible');
};

const goToPage = (
    fakeUser = superUser,
    formQuery,
    fixture = listFixture,
    url = baseUrl,
) => {
    cy.login();
    interceptFlag = false;
    cy.intercept('GET', '/sockjs-node/**');
    cy.intercept('GET', '/api/profiles/me/**', fakeUser);
    cy.intercept('GET', '/api/groups/dropdown/**', {
        fixture: `groups/dropdownlist.json`,
    });
    cy.intercept('GET', '/api/v2/orgunittypes/**', {
        fixture: 'orgunittypes/list.json',
    });

    cy.intercept('GET', '/api/forms/**', {
        fixture: 'forms/list.json',
    });

    const options = {
        method: 'GET',
        pathname: '/api/orgunits/changes/**',
    };
    const query = {
        ...defaultQuery,
        ...formQuery,
    };
    cy.intercept({ ...options, query }, req => {
        interceptFlag = true;
        req.reply({
            statusCode: 200,
            body: fixture,
        });
    }).as('getOrgUnitChanges');
    cy.visit(url);
};

const testRowContent = (index, changeRequest = listFixture.results[index]) => {
    const groups = [];
    changeRequest.groups.forEach(group => {
        groups.push(group.name);
    });
    const changeRequestCreatedAt = moment
        .unix(changeRequest.created_at)
        .format('DD/MM/YYYY HH:mm');
    const changeRequestUpdatedAt = moment
        .unix(changeRequest.updated_at)
        .format('DD/MM/YYYY HH:mm');
    cy.get('table').as('table');
    cy.get('@table').find('tbody').find('tr').eq(index).as('row');
    cy.get('@row').find('td').eq(0).should('contain', changeRequest.id);
    cy.get('@row')
        .find('td')
        .eq(1)
        .should('contain', changeRequest.org_unit_name);
    cy.get('@row')
        .find('td')
        .eq(2)
        .should('contain', changeRequest.org_unit_parent_name);
    cy.get('@row')
        .find('td')
        .eq(3)
        .should('contain', changeRequest.org_unit_type_name);

    cy.get('@row').find('td').eq(4).should('contain', groups.join(', '));
    cy.get('@row')
        .find('td')
        .eq(5)
        .find('div')
        .eq(0)
        .should(
            'contain',
            changeRequest.status.charAt(0).toUpperCase() +
                changeRequest.status.slice(1),
        );

    cy.get('@row').find('td').eq(6).should('contain', changeRequestCreatedAt);
    cy.get('@row')
        .find('td')
        .eq(7)
        .should('contain', changeRequest.created_by.username);

    cy.get('@row').find('td').eq(8).should('contain', changeRequestUpdatedAt);
    cy.get('@row')
        .find('td')
        .eq(9)
        .should('contain', changeRequest.updated_by.username);
};

const getActionCol = (index = 0) => {
    table = cy.get('table');
    row = table.find('tbody').find('tr').eq(1);
    row.find('td').eq(index).as('actionCol');
};

describe('Organisations changes', () => {
    it('Api should be called with base params', () => {
        goToPage(superUser, {}, emptyFixture);
        cy.wait('@getOrgUnitChanges').then(() => {
            cy.wrap(interceptFlag).should('eq', true);
        });
    });

    describe('page', () => {
        it('page should not be accessible if user does not have permission', () => {
            goToPage({
                ...superUser,
                permissions: [],
                is_superuser: false,
            });
            const errorCode = cy.get('#error-code');
            errorCode.should('contain', '403');
        });
    });
    describe('Table', () => {
        beforeEach(() => {
            goToPage();
            cy.intercept(
                'GET',
                '/api/orgunits/changes/**/?order=-updated_at&limit=10&page=2',
                page2,
            );
        });
        testTablerender({
            baseUrl,
            rows: listFixture.results.length,
            columns: 11,
            withVisit: false,
            apiKey: 'orgunits/changes',
        });
        testPagination({
            baseUrl,
            apiPath: '/api/orgunits/changes/**',
            apiKey: 'results',
            withSearch: false,
            fixture: listFixture,
            query: {
                limit: '10',
                order: '-updated_at',
            },
        });
        it('should render correct row infos', () => {
            cy.wait('@getOrgUnitChanges').then(() => {
                testRowContent(0);
            });
        });

        describe('Action columns', () => {
            it('should display correct amount of buttons', () => {
                cy.wait('@getOrgUnitChanges').then(() => {
                    getActionCol(10);
                    cy.get('@actionCol')
                        .find('button')
                        .should('have.length', 1);
                });
            });
            it('should display correct changes request infos and approve', () => {
                goToPage();
                cy.intercept('GET', '/api/orgunits/changes/27', {
                    fixture: 'orgunits/changes/orgUnitChange-27.json',
                });
                cy.wait('@getOrgUnitChanges').then(() => {
                    const orgUnitChangeIndex = 0;
                    openDialogForChangeRequestIndex(orgUnitChangeIndex);

                    interceptFlag = false;
                    cy.intercept(
                        {
                            method: 'PATCH',
                            pathname: `/api/orgunits/changes/27`,
                        },
                        req => {
                            interceptFlag = true;
                            req.reply({
                                statusCode: 200,
                                body: {
                                    status: 'approved',
                                    approved_fields: ['new_name'],
                                },
                            });
                        },
                    ).as('approveChanges');

                    cy.get('#check-box-name').click();
                    cy.get('#approve-orgunit-changes-dialog')
                        .find('button')
                        .eq(3)
                        .click()
                        .then(() => {});
                    cy.wait('@approveChanges').then(() => {
                        cy.wrap(interceptFlag).should('eq', true);
                    });
                });
            });

            it('should display correct changes request infos and reject all', () => {
                goToPage();
                cy.intercept('GET', '/api/orgunits/changes/27', {
                    fixture: 'orgunits/changes/orgUnitChange-27.json',
                });
                cy.wait('@getOrgUnitChanges').then(() => {
                    const orgUnitChangeIndex = 0;
                    openDialogForChangeRequestIndex(orgUnitChangeIndex);
                    cy.get('#approve-orgunit-changes-dialog')
                        .find('button')
                        .eq(2)
                        .click()
                        .then(() => {});
                    const textArea = cy.get('textarea');
                    textArea.type('test comment');
                    const comment = textArea.value;
                    cy.intercept(
                        {
                            method: 'PATCH',
                            pathname: `/api/orgunits/changes/27`,
                        },
                        req => {
                            interceptFlag = true;
                            req.reply({
                                statusCode: 200,
                                body: {
                                    status: 'rejected',
                                    rejection_comment: comment,
                                },
                            });
                        },
                    ).as('approveChanges');
                    cy.get('[data-test="confirm-comment-button"]').click();
                    interceptFlag = false;

                    cy.wait('@approveChanges').then(() => {
                        cy.wrap(interceptFlag).should('eq', true);
                    });
                });
            });

            it('should display approved changes request infos and close', () => {
                goToPage();
                cy.intercept('GET', '/api/orgunits/changes/27', {
                    fixture: 'orgunits/changes/approvedOrgUnitChange-27.json',
                });
                cy.wait('@getOrgUnitChanges').then(() => {
                    const orgUnitChangeIndex = 0;
                    openDialogForChangeRequestIndex(orgUnitChangeIndex);
                    cy.get('#approve-orgunit-changes-dialog')
                        .find('button')
                        .eq(1)
                        .click()
                        .then(() => {});
                });
            });
        });
        it('sort should deep link and call api with correct params', () => {
            cy.wait('@getOrgUnitChanges').then(() => {
                const sorts = [
                    {
                        colIndex: 0,
                        order: 'id',
                    },
                    {
                        colIndex: 1,
                        order: 'org_unit__name',
                    },
                    {
                        colIndex: 2,
                        order: 'org_unit__parent__name',
                    },
                    {
                        colIndex: 3,
                        order: 'org_unit__org_unit_type__name',
                    },
                    {
                        colIndex: 5,
                        order: 'status',
                    },
                    {
                        colIndex: 6,
                        order: 'created_at',
                    },
                    {
                        colIndex: 7,
                        order: 'created_by__username',
                    },
                    {
                        colIndex: 8,
                        order: 'updated_at',
                    },
                    {
                        colIndex: 9,
                        order: 'updated_by__username',
                    },
                ];
                sorts.forEach(s => {
                    testTableSort({
                        colIndex: s.colIndex,
                        order: s.order,
                        apiPath: 'orgunits/changes',
                        fixture: listFixture,
                        defaultQuery,
                    });
                });
            });
        });
    });

    describe('Filters', () => {
        beforeEach(() => {
            goToPage();
        });
        it('change filters should deep link and call api with correct params', () => {
            cy.wait('@getOrgUnitChanges').then(() => {
                cy.intercept(
                    {
                        method: 'GET',
                        pathname: '/api/orgunits/changes/**',
                    },
                    {
                        ...defaultQuery,
                        groups: newFilters.groups.urlValue,
                        forms: newFilters.forms.urlValue,
                        parent_id: newFilters.parent_id.urlValue,
                        org_unit_type_id: newFilters.org_unit_type_id.urlValue,
                        withLocation: newFilters.withLocation.urlValue,
                        created_at_after: newFilters.created_at_after.urlValue,
                        created_at_before:
                            newFilters.created_at_before.urlValue,
                        userRoles: newFilters.userRoles.urlValue,
                        status: newFilters.status.urlValue,
                    },

                    req => {
                        interceptFlag = true;
                        req.reply({
                            statusCode: 200,
                            body: listFixture,
                        });
                    },
                ).as('getOrgUnitChangesSearch');

                testPageFilters(newFilters);
                cy.wait('@getOrgUnitChangesSearch').then(() => {
                    cy.wrap(interceptFlag).should('eq', true);
                });
            });
        });

        it('select users should filter change requests by user ids', () => {
            cy.intercept('GET', '/api/profiles/?search=lui', {
                fixture: 'profiles/search/lui.json',
            });
            cy.intercept('GET', '/api/profiles/?ids=69', {
                fixture: 'profiles/search/mario.json',
            });
            cy.intercept('GET', '/api/profiles/?ids=999', {
                fixture: 'profiles/search/lui.json',
            });
            cy.intercept('GET', '/api/profiles/?search=mario', {
                fixture: 'profiles/search/mario.json',
            });
            cy.intercept('GET', '/api/profiles/?ids=999%2C69', {
                fixture: 'profiles/ids/69-999.json',
            });
            cy.intercept('GET', '/api/profiles/?ids=69%2C999', {
                fixture: 'profiles/ids/69-999.json',
            });
            goToPage();
            cy.wait('@getOrgUnitChanges').then(() => {
                cy.intercept(
                    { method: 'GET', pathname: '/api/orgunits/changes/**' },
                    {
                        ...defaultQuery,
                        userIds: '999',
                    },
                    req => {
                        interceptFlag = true;
                        req.reply({
                            statusCode: 200,
                            body: listFixture,
                        });
                    },
                ).as('Luigi');
            });

            cy.get('#userIds').type('lui');
            cy.wait(800);
            cy.get('#userIds').type('{downarrow}').type('{enter}');
            cy.get('[data-test="search-button"]').click();
            cy.wait('@Luigi').then(() => {
                cy.wrap(interceptFlag).should('eq', true);
            });
            interceptFlag = false;
            cy.intercept(
                { method: 'GET', pathname: '/api/orgunits/changes/**' },
                {
                    ...defaultQuery,
                    userIds: '999,69',
                },

                req => {
                    interceptFlag = true;
                    req.reply({
                        statusCode: 200,
                        body: listFixture,
                    });
                },
            ).as('LuigiMario');

            cy.get('#userIds').type('mario');
            cy.wait(800);
            cy.get('#userIds').type('{downarrow}').type('{enter}');
            cy.get('[data-test="search-button"]').click();
            cy.wait('@LuigiMario').then(() => {
                cy.wrap(interceptFlag).should('eq', true);
            });
        });
    });

    describe('Export csv buttons', () => {
        it('should download orgUnit change request csv file via an anchor click', () => {
            goToPage();
            cy.wait('@getOrgUnitChanges').then(() => {
                cy.fillMultiSelect('#groups', [1, 2], false);
                cy.fillMultiSelect('#status', [0], false);
                cy.get('[data-test="search-button"]').click();
                cy.get('[data-test="download-buttons"]')
                    .find('a')
                    .eq(0)
                    .as('csvExportButton');

                cy.get('@csvExportButton').should(
                    'have.attr',
                    'href',
                    `/api/orgunits/changes/export_to_csv/?&groups=2,3&status=new`,
                );
            });
        });
    });
});
