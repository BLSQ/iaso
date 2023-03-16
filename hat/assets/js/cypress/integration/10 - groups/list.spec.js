/// <reference types="cypress" />

import moment from 'moment';

import { formatThousand } from 'bluesquare-components';
import listFixture from '../../fixtures/groups/list-page1.json';
import listFixture2 from '../../fixtures/groups/list-page2.json';
import emptyFixture from '../../fixtures/groups/empty.json';
import superUser from '../../fixtures/profiles/me/superuser.json';

import { testPermission } from '../../support/testPermission';
import { testTablerender } from '../../support/testTableRender';
import { testPagination } from '../../support/testPagination';
import { testSearchField } from '../../support/testSearchField';
import { search, searchWithForbiddenChars } from '../../constants/search';

const siteBaseUrl = Cypress.env('siteBaseUrl');
const baseUrl = `${siteBaseUrl}/dashboard/orgunits/groups`;

let interceptFlagGroups = false;

let interceptFlag = false;
let table;
let row;
const defaultQuery = {
    limit: '20',
    order: 'name',
    page: '1',
};

const goToPage = ({
    formQuery = {},
    fakeUser = superUser,
    fixture = listFixture,
}) => {
    cy.login();
    interceptFlag = false;
    cy.intercept('GET', '/sockjs-node/**');
    cy.intercept('GET', '/api/profiles/me/**', fakeUser);
    const options = {
        method: 'GET',
        pathname: '/api/groups',
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
    }).as('getGroups');
    cy.visit(baseUrl);
};

const openDialogForIndex = index => {
    table = cy.get('table');
    row = table.find('tbody').find('tr').eq(index);
    const actionCol = row.find('td').last();
    const editButton = actionCol.find('button').first();
    editButton.click();
    cy.get('[data-test="groups-dialog"]').should('be.visible');
};

const testDialogContent = group => {
    cy.get('#input-text-name').clear().type(group.name);
    cy.testInputValue('#input-text-name', group.name);
    cy.get('#input-text-source_ref').clear().type(group.source_ref);
    cy.testInputValue('#input-text-source_ref', group.source_ref);
};

const testRowContent = (index, group = listFixture.groups[index]) => {
    const updatedAt = moment.unix(group.updated_at).format('DD/MM/YYYY HH:mm');

    cy.get('table').as('table');
    cy.get('@table').find('tbody').find('tr').eq(index).as('row');
    cy.get('@row').find('td').eq(0).should('contain', group.id);
    cy.get('@row').find('td').eq(1).should('contain', group.name);
    cy.get('@row').find('td').eq(2).should('contain', updatedAt);

    cy.get('@row')
        .find('td')
        .eq(3)
        .should('contain', group.source_version.data_source.name);
    cy.get('@row').find('td').eq(4).should('contain', group.source_ref);
    cy.get('@row').find('td').eq(5).should('contain', group.org_unit_count);
};

const mockListCall = (keyName, body) => {
    interceptFlagGroups = false;
    cy.intercept(
        {
            method: 'GET',
            pathname: '/api/groups',
            query: defaultQuery,
        },
        req => {
            interceptFlagGroups = true;
            req.reply({
                statusCode: 200,
                body,
            });
        },
    ).as(keyName);
};

const mockSaveCall = (method, index, pathname, group) => {
    interceptFlag = false;
    cy.intercept(
        {
            method,
            pathname,
        },
        req => {
            interceptFlag = true;
            expect(req.body).to.deep.equal(group);

            req.reply({
                statusCode: 200,
                body: listFixture.groups[index],
            });
        },
    ).as('saveGroup');
};

describe('Groups', () => {
    describe('Page', () => {
        it('should redirect to url with pagination params', () => {
            goToPage({});

            cy.wait('@getGroups').then(() => {
                cy.url().should(
                    'eq',
                    `${baseUrl}/accountId/1/order/name/pageSize/20/page/1`,
                );
            });
        });
        it('should not be accessible if user does not have permission', () => {
            testPermission(baseUrl);
        });
    });

    describe('Search field', () => {
        beforeEach(() => {
            goToPage({});
        });
        testSearchField(search, searchWithForbiddenChars);
    });

    describe('Search button', () => {
        beforeEach(() => {
            goToPage({});
        });
        it('should be disabled', () => {
            cy.wait('@getGroups').then(() => {
                cy.get('[data-test="search-button"]')
                    .invoke('attr', 'disabled')
                    .should('equal', 'disabled');
            });
        });
        it('should be enabled while searching', () => {
            cy.wait('@getGroups').then(() => {
                cy.get('#search-search').type(search);
                cy.get('[data-test="search-button"]')
                    .invoke('attr', 'disabled')
                    .should('equal', undefined);
            });
        });
        it('action should deep link search', () => {
            cy.wait('@getGroups').then(() => {
                cy.get('#search-search').type(search);

                cy.get('[data-test="search-button"]').click();
                cy.url().should('contain', `/search/${search}`);
            });
        });
    });

    describe('Pagination count', () => {
        it('should render number of results matching api results', () => {
            goToPage({});

            cy.get('.pagination-count').should(
                'contain',
                `${formatThousand(listFixture.count)}`,
            );
        });
    });

    describe('Table', () => {
        beforeEach(() => {
            goToPage({});
            cy.intercept(
                'GET',
                '/api/groups/?limit=20&order=name&page=2',
                listFixture2,
            );
        });

        testTablerender({
            baseUrl,
            rows: listFixture.groups.length,
            columns: 7,
            apiKey: 'groups',
        });
        testPagination({
            baseUrl,
            apiPath: '/api/groups/**',
            apiKey: 'groups',
            withSearch: false,
            fixture: listFixture,
        });

        it('should render correct row infos', () => {
            cy.wait('@getGroups').then(() => {
                testRowContent(0);
            });
        });

        it('should display correct amount of buttons on action column', () => {
            cy.wait('@getGroups').then(() => {
                table = cy.get('table');
                row = table.find('tbody').find('tr').eq(1);
                const actionCol = row.find('td').last();
                actionCol.find('button').should('have.length', 2);
            });
        });
    });

    describe('Org units', () => {
        beforeEach(() => {
            goToPage({});
        });
        it('should contain a link redirecting to the right org unit', () => {
            cy.wait('@getGroups').then(() => {
                const href =
                    '/dashboard/orgunits/list/locationLimit/3000/order/id/pageSize/50/page/1/searchTabIndex/0/searchActive/true/searches/[{"validation_status":"all", "color":"f4511e", "group":"1", "source": null}]';
                table = cy.get('table');
                row = table.find('tbody').find('tr').eq(0);
                const orgUnitLinkCol = row.find('td').eq(5);
                orgUnitLinkCol.find('a').should('have.attr', 'href', href);
            });
        });
    });

    describe('Dialog', () => {
        beforeEach(() => {
            goToPage({});
        });

        it('should display empty group dialog on create', () => {
            // this will be tested when creation will be enabled
            cy.wait('@getGroups').then(() => {
                cy.get('[data-test="add-group-button"]').click();
                cy.get('[data-test="groups-dialog"]').should('be.visible');

                cy.testInputValue('#input-text-name', '');
                cy.testInputValue('#input-text-source_ref', '');
            });
        });

        it('should display correct group infos', () => {
            cy.wait('@getGroups').then(() => {
                const index = 0;
                openDialogForIndex(index);

                cy.testInputValue(
                    '#input-text-name',
                    listFixture.groups[index].name,
                );
                cy.testInputValue(
                    '#input-text-source_ref',
                    listFixture.groups[index].source_ref,
                );
            });
        });

        it('should save correctly', () => {
            cy.wait('@getGroups').then(() => {
                const index = 0;
                openDialogForIndex(index);
                const newGroup = {
                    id: listFixture.groups[index].id,
                    name: 'sacha',
                    source_ref: 'gt15',
                };
                const newGroups = [...listFixture.groups];
                cy.log('modify group in the list with new name and new ref');
                newGroups[index] = {
                    ...listFixture.groups[index],
                    ...newGroup,
                };
                const newList = {
                    ...listFixture,
                    groups: newGroups,
                };

                mockSaveCall(
                    'PATCH',
                    index,
                    `/api/groups/${listFixture.groups[index].id}/`,
                    newGroup,
                );
                testDialogContent(newGroup);
                mockListCall('getGroupsAfterSave', newList);

                cy.get('.MuiDialogActions-root').find('button').last().click();
                cy.wait('@saveGroup').then(() => {
                    cy.wrap(interceptFlag).should('eq', true);
                    cy.wait('@getGroupsAfterSave').then(() => {
                        cy.wrap(interceptFlagGroups).should('eq', true);
                        testRowContent(0, newList.groups[index]);
                    });
                });
            });
        });

        it('should create correctly', () => {
            cy.wait('@getGroups').then(() => {
                const index = 0;
                cy.get('[data-test="add-group-button"]').click();
                let newGroup = {
                    name: 'create',
                    source_ref: 'zu18',
                };
                testDialogContent(newGroup);

                mockSaveCall('POST', index, '/api/groups/', newGroup);
                cy.log(
                    'set default source version and updated at created by the backend + create fake id',
                );
                newGroup = {
                    ...listFixture.groups[2],
                    ...newGroup,
                    id: 999,
                };
                const newList = {
                    ...listFixture,
                };
                cy.log(
                    'inject new group to the new list of groups that will be mocked',
                );
                newList.groups.unshift(newGroup);
                mockListCall('getGroupsAfterCreate', newList);

                cy.get('.MuiDialogActions-root').find('button').last().click();
                cy.wait('@saveGroup').then(() => {
                    cy.wrap(interceptFlag).should('eq', true);
                    cy.wait('@getGroupsAfterCreate').then(() => {
                        cy.wrap(interceptFlagGroups).should('eq', true);
                        testRowContent(0, newGroup);
                    });
                });
            });
        });
    });

    describe('Save button in Dialog', () => {
        beforeEach(() => {
            goToPage({});
        });

        it('should be disabled if name value is an empty string', () => {
            cy.wait('@getGroups').then(() => {
                // on create
                cy.get('[data-test="add-group-button"]').click();
                cy.get('[data-test="groups-dialog"]').should('be.visible');
                cy.get('.MuiDialogActions-root')
                    .find('button')
                    .last()
                    .as('saveButton');
                cy.get('@saveButton').should('be.disabled');

                const name = 'Lucius';
                cy.get('#input-text-name').type(name).clear();
                cy.testInputValue('#input-text-name', '');
                cy.get('.MuiDialogActions-root')
                    .find('button')
                    .last()
                    .as('saveButton');
                cy.get('@saveButton').should('be.disabled');
                cy.get('.MuiDialogActions-root')
                    .find('button')
                    .first()
                    .as('cancelButton');
                cy.get('@cancelButton').click();

                // on edit
                table = cy.get('table');
                row = table.find('tbody').find('tr').eq(0);
                const actionCol = row.find('td').last();
                actionCol.find('button').first().as('editButton');
                cy.get('@editButton').click();
                cy.get('[data-test="groups-dialog"]').should('be.visible');
                cy.get('@saveButton').should('not.be.disabled');

                cy.get('#input-text-name').clear();
                cy.get('@saveButton').should('be.disabled');
            });
        });
    });

    describe('Delete dialog', () => {
        beforeEach(() => {
            goToPage({});
            const index = 0;
            table = cy.get('table');
            row = table.find('tbody').find('tr').eq(index);
            const actionCol = row.find('td').last();
            const deleteButton = actionCol.find('button').last();
            deleteButton.click();
            cy.get('#delete-dialog-group').as('deleteDialog');
        });

        it('should open delete dialog', () => {
            cy.wait('@getGroups').then(() => {
                cy.get('@deleteDialog').should('be.visible');
            });
        });
        it('should delete group on confirm', () => {
            cy.wait('@getGroups').then(() => {
                interceptFlag = false;
                const index = 0;
                cy.intercept(
                    {
                        method: 'DELETE',
                        pathname: `/api/groups/${listFixture.groups[index].id}/`,
                    },
                    req => {
                        interceptFlag = true;
                        req.reply({
                            statusCode: 200,
                        });
                    },
                ).as('deleteGroup');
                interceptFlagGroups = false;
                cy.intercept(
                    {
                        method: 'GET',
                        pathname: '/api/groups',
                        query: defaultQuery,
                    },
                    req => {
                        interceptFlagGroups = true;
                        req.reply({
                            statusCode: 200,
                            body: listFixture,
                        });
                    },
                ).as('getGroupsAfterDelete');
                cy.get('@deleteDialog')
                    .parent()
                    .parent()
                    .find('button')
                    .last()
                    .as('confirmDeleteButton')
                    .click();
                cy.wait('@deleteGroup').then(() => {
                    cy.wrap(interceptFlag).should('eq', true);
                });
                cy.wait('@getGroupsAfterDelete').then(() => {
                    cy.wrap(interceptFlagGroups).should('eq', true);
                });
            });
        });
        it('should close delete dialog on cancel', () => {
            cy.wait('@getGroups').then(() => {
                cy.get('@deleteDialog')
                    .parent()
                    .parent()
                    .find('button')
                    .first()
                    .as('cancelDeleteButton')
                    .click();
                cy.get('#delete-dialog-group').should('not.exist');
            });
        });
    });

    describe('Api', () => {
        beforeEach(() => {
            goToPage({ emptyFixture });
        });

        it('should be called with base params', () => {
            cy.wait('@getGroups').then(() => {
                cy.wrap(interceptFlag).should('eq', true);
            });
        });
        it('should be called with search params', () => {
            cy.wait('@getGroups').then(() => {
                interceptFlag = false;
                cy.intercept(
                    {
                        method: 'GET',
                        pathname: '/api/groups',
                        query: {
                            limit: '20',
                            order: 'name',
                            page: '1',
                            search,
                        },
                    },
                    req => {
                        interceptFlag = true;
                        req.reply({
                            statusCode: 200,
                            body: emptyFixture,
                        });
                    },
                ).as('getEntitySearch');
                cy.get('#search-search').type(search);
                cy.get('[data-test="search-button"]').click();
                cy.wait('@getEntitySearch').then(() => {
                    cy.wrap(interceptFlag).should('eq', true);
                });
            });
        });
    });
});
