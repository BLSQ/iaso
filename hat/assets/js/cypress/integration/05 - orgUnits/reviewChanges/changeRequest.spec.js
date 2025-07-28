/// <reference types="cypress" />
import moment from 'moment';
import dataSources from '../../../fixtures/datasources/details-ou.json';
import emptyFixture from '../../../fixtures/orgunits/changes/empty.json';
import page2 from '../../../fixtures/orgunits/changes/orgUnitChanges-page2.json';
import listFixture from '../../../fixtures/orgunits/changes/orgUnitChanges.json';
import orgUnits from '../../../fixtures/orgunits/list.json';
import orgUnitTypes from '../../../fixtures/orgunittypes/dropdown-list.json';
import superUser from '../../../fixtures/profiles/me/superuser.json';
import projects from '../../../fixtures/projects/list.json';
import sourceversion from '../../../fixtures/sourceversions/sourceversion.json';
import userRoles from '../../../fixtures/userRoles/list.json';
import { testPageFilters } from '../../../support/testPageFilters';
import { testPagination } from '../../../support/testPagination';
import { testTablerender } from '../../../support/testTableRender';
import { testTableSort } from '../../../support/testTableSort';

const siteBaseUrl = Cypress.env('siteBaseUrl');
const baseUrl = `${siteBaseUrl}/dashboard/validation/changeRequest`;

let interceptFlag = false;
let table;
let row;
const defaultQuery = {
    limit: '10',
    order: '-updated_at',
};
const newFilters = {
    projectIds: {
        value: [0],
        urlValue: '1',
        selector: '#projectIds',
        type: 'multi',
        clear: false,
    },
    // groups: {
    //     value: [0],
    //     urlValue: '1',
    //     selector: '#groups',
    //     type: 'multi',
    //     clear: false,
    // },
    forms: {
        value: [0],
        urlValue: '1',
        selector: '#forms',
        type: 'multi',
        clear: false,
    },
    parent_id: {
        value: 2,
        urlValue: orgUnits.orgunits[2].id,
        selector: '#ou-tree-input',
        type: 'tree',
    },
    org_unit_type_id: {
        value: [0],
        urlValue: orgUnitTypes[0].id,
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
        urlValue: userRoles.results[0].id, // This seems dependant on the DB
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
    const actionCol = row.find('td').eq(11);
    const editButton = actionCol.find('button').first();
    editButton.click();
    cy.url().should(
        'eq',
        `${baseUrl}/detail/accountId/1/changeRequestId/${listFixture.results[index].id}`,
    );
};

const goToPage = (
    // eslint-disable-next-line default-param-last
    fakeUser = superUser,
    formQuery,
    fixture = listFixture,
    url = baseUrl,
) => {
    cy.login();
    interceptFlag = false;
    cy.intercept('GET', '/sockjs-node/**');
    cy.intercept('GET', '/api/profiles/me/**', fakeUser);
    cy.intercept('GET', '/api/sourceversions/3/', sourceversion);
    cy.intercept('GET', '/api/groups/dropdown/?defaultVersion=3', {
        fixture: `groups/dropdownlist.json`,
    });

    cy.intercept(
        'GET',
        '/api/datasources/?filter_empty_versions=true/',
        dataSources,
    );
    cy.intercept('GET', '/api/v2/orgunittypes/dropdown/', orgUnitTypes);
    cy.intercept('GET', '/api/projects/', projects);

    cy.intercept('GET', '/api/forms/**', {
        fixture: 'forms/list.json',
    });
    cy.intercept('GET', '/api/userroles/**', userRoles).as('userRoles');

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
    const projects = [];
    changeRequest.projects.forEach(project => {
        projects.push(project.name);
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
    cy.get('@row').find('td').eq(1).should('contain', projects.join(', '));
    cy.get('@row')
        .find('td')
        .eq(2)
        .should('contain', changeRequest.org_unit_name);
    cy.get('@row')
        .find('td')
        .eq(3)
        .should('contain', changeRequest.org_unit_parent_name);
    cy.get('@row')
        .find('td')
        .eq(4)
        .should('contain', changeRequest.org_unit_type_name);

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

    cy.get('@row').find('td').eq(9).should('contain', changeRequestUpdatedAt);
    cy.get('@row')
        .find('td')
        .eq(10)
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
            cy.get('#error-code').should('contain', '403');
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
            columns: 13,
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
                    getActionCol(11);
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

                    cy.intercept(
                        {
                            method: 'PATCH',
                            pathname: `/api/orgunits/changes/27`,
                        },
                        req => {
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
                    cy.get('[data-test="confirm-button"]').click();
                    cy.get('[data-test="cancel-comment-button"]').click();
                    cy.get('[data-test="confirm-button"]').click();
                    cy.get('[data-test="confirm-comment-button"]').click();
                    cy.wait('@approveChanges').then(interception => {
                        cy.wrap(interception)
                            .its('request.body.status')
                            .should('eq', 'approved');
                        cy.wrap(interception)
                            .its('request.body.approved_fields[0]')
                            .should('eq', 'new_name');
                        cy.wrap(interception)
                            .its('request.body.approved_fields.length')
                            .should('eq', 1);
                    });
                });
            });
            it('should display correct changes request infos and partially approve', () => {
                goToPage();
                cy.intercept('GET', '/api/orgunits/changes/23', {
                    fixture: 'orgunits/changes/orgUnitChange-23.json',
                });
                cy.wait('@getOrgUnitChanges').then(() => {
                    const orgUnitChangeIndex = 1;
                    openDialogForChangeRequestIndex(orgUnitChangeIndex);

                    cy.intercept(
                        {
                            method: 'PATCH',
                            pathname: `/api/orgunits/changes/23`,
                        },
                        req => {
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
                    cy.get('[data-test="confirm-button"]').click();
                    cy.get('[data-test="cancel-comment-button"]').click();
                    cy.get('[data-test="confirm-button"]').click();
                    cy.get('textarea').type('test comment');
                    cy.get('[data-test="confirm-comment-button"]').click();
                    cy.wait('@approveChanges').then(interception => {
                        cy.wrap(interception)
                            .its('request.body.status')
                            .should('eq', 'approved');
                        cy.wrap(interception)
                            .its('request.body.approved_fields[0]')
                            .should('eq', 'new_name');
                        cy.wrap(interception)
                            .its('request.body.approved_fields.length')
                            .should('eq', 1);
                        cy.wrap(interception)
                            .its('request.body.rejection_comment')
                            .should('eq', 'test comment');
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
                    cy.get('[data-test="reject-button"]').click();
                    const textArea = cy.get('textarea');
                    textArea.type('test comment');
                    const comment = textArea.value;
                    cy.intercept(
                        {
                            method: 'PATCH',
                            pathname: `/api/orgunits/changes/27`,
                        },
                        req => {
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

                    cy.wait('@approveChanges').then(interception => {
                        cy.wrap(interception)
                            .its('request.body.status')
                            .should('eq', 'rejected');
                        cy.wrap(interception)
                            .its('request.body.rejection_comment')
                            .should('eq', 'test comment');
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
                    cy.get('#top-bar-back-button')
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
                        colIndex: 2,
                        order: 'org_unit__name',
                    },
                    {
                        colIndex: 3,
                        order: 'org_unit__parent__name',
                    },
                    {
                        colIndex: 4,
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
                        order: 'payment_status',
                    },
                    {
                        colIndex: 9,
                        order: 'updated_at',
                    },
                    {
                        colIndex: 10,
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
                        refetchDefault: false,
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
                        projects: newFilters.projectIds.urlValue,
                        // groups: newFilters.groups.urlValue,
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
                // cy.fillMultiSelect('#groups', [1, 2], false);
                cy.fillMultiSelect('#status', [0], false);
                cy.get('[data-test="search-button"]').click();
                cy.get('[data-test="download-buttons"]')
                    .find('a')
                    .eq(0)
                    .as('csvExportButton');

                cy.get('@csvExportButton').should(
                    'have.attr',
                    'href',
                    // `/api/orgunits/changes/export_to_csv/?&groups=2,3&status=new`,
                    `/api/orgunits/changes/export_to_csv/?&status=new&source_version_id=3`,
                );
            });
        });
    });
});
