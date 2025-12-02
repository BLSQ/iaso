/// <reference types="cypress" />

import { search, searchWithForbiddenChars } from '../../constants/search';
import orgUnits from '../../fixtures/orgunits/list.json';
import listFixture from '../../fixtures/profiles/list.json';
import superUser from '../../fixtures/profiles/me/superuser.json';
import { testSearchField } from '../../support/testSearchField';

const siteBaseUrl = Cypress.env('siteBaseUrl');
const baseUrl = `${siteBaseUrl}/dashboard/settings/users/management`;

let interceptFlag = false;
const orgUnitTreeIndexSearch = 2;
const emptyFixture = 'profiles/empty.json';
let table;
let row;
const defaultQuery = {
    limit: '20',
    order: 'user__username',
    page: '1',
};
const goToPage = (
    fakeUser = superUser,
    formQuery,
    fixture = 'profiles/list.json',
) => {
    cy.login();
    interceptFlag = false;
    cy.intercept('GET', '/sockjs-node/**');
    cy.intercept('GET', '/api/profiles/me/**', fakeUser);
    cy.intercept('GET', '/api/userroles/**', {
        fixture: 'userRoles/list.json',
    });
    cy.intercept('GET', '/api/projects/**', {
        fixture: 'projects/list.json',
    });
    cy.intercept('GET', '/api/permissions', {
        fixture: 'permissions/list.json',
    });
    cy.intercept('GET', '/api/permissions/grouped_permissions', {
        fixture: 'permissions/grouped.json',
    });
    cy.intercept('GET', '/api/v2/orgunittypes/dropdown/', {
        fixture: 'orgunittypes/dropdown-list.json',
    });
    cy.intercept('GET', '/api/teams/**/*', {
        fixture: 'teams/list.json',
    });
    cy.intercept(
        'GET',
        `/api/orgunits/${orgUnits.orgunits[orgUnitTreeIndexSearch].id}`,
        orgUnits.orgunits[orgUnitTreeIndexSearch],
    );
    const options = {
        method: 'GET',
        pathname: '/api/profiles/',
    };
    const query = {
        ...defaultQuery,
        ...formQuery,
        managedUsersOnly: 'true',
    };
    cy.intercept({ ...options, query }, req => {
        req.continue(res => {
            interceptFlag = true;
            res.send({ fixture });
        });
    }).as('getUsers');
    cy.visit(baseUrl);
};
const openDialogForUserIndex = index => {
    table = cy.get('table');
    row = table.find('tbody').find('tr').eq(index);
    const actionCol = row.find('td').eq(7);
    const editButton = actionCol.find('button').first();
    editButton.click();
    cy.get('#user-profile-dialog').should('be.visible');
};
const userInfosFields = [
    'user_name',
    'first_name',
    'last_name',
    'email',
    'dhis2_id',
];
describe('Users', () => {
    describe('Page', () => {
        it('should redirect to url with pagination params', () => {
            goToPage();

            cy.wait('@getUsers').then(() => {
                cy.url().should(
                    'eq',
                    `${baseUrl}/accountId/1/order/user__username/pageSize/20/page/1`,
                );
            });
        });
        it('should not be accessible if user does not have permission', () => {
            goToPage({
                ...superUser,
                permissions: [],
                is_superuser: false,
            });
            const errorCode = cy.get('#error-code');
            errorCode.should('contain', '403');
        });
    });

    describe('Search field', () => {
        beforeEach(() => {
            goToPage();
            cy.wait('@getUsers');
        });
        testSearchField(search, searchWithForbiddenChars);
    });
    describe('Search button', () => {
        beforeEach(() => {
            goToPage();
        });
        it('should be disabled', () => {
            cy.wait('@getUsers').then(() => {
                cy.get('[data-test="search-button"]')
                    .invoke('attr', 'disabled')
                    .should('equal', 'disabled');
            });
        });
        it('should be enabled while searching', () => {
            cy.get('#search-search').type(search);
            cy.wait('@getUsers').then(() => {
                cy.get('[data-test="search-button"]')
                    .invoke('attr', 'disabled')
                    .should('equal', undefined);
            });
        });
        it('action should deep link search', () => {
            cy.wait('@getUsers').then(() => {
                cy.get('#search-search').type(search);

                cy.get('[data-test="search-button"]').click();
                cy.url().should('contain', `/search/${search}`);
            });
        });
    });

    describe('Table', () => {
        it('should render results', () => {
            goToPage();
            cy.wait('@getUsers').then(() => {
                table = cy.get('table');
                table.should('have.length', 1);
                const rows = table.find('tbody').find('tr');
                rows.should('have.length', listFixture.profiles.length);
                rows.eq(0).find('td').should('have.length', 9);
            });
        });

        it('should display correct amount of buttons on action column', () => {
            goToPage();
            cy.wait('@getUsers').then(() => {
                table = cy.get('table');
                row = table.find('tbody').find('tr').eq(1);
                const actionCol = row.find('td').eq(7);
                actionCol.find('button').should('have.length', 3);
                table = cy.get('table');
                row = table.find('tbody').find('tr').eq(0);
                const actionColCurrentUser = row.find('td').eq(7);
                actionColCurrentUser.find('button').should('have.length', 2);
            });
        });
    });

    describe('User dialog', () => {
        it('should display empty user infos', () => {
            goToPage();
            cy.wait('@getUsers').then(() => {
                cy.get('[data-test="add-user-button"]').click();
                cy.get('#user-profile-dialog').should('be.visible');
                userInfosFields.forEach(f => {
                    cy.testInputValue(`#input-text-${f}`, '');
                });
                cy.testInputValue(`#projects`, '');
                cy.testInputValue('#language', '');
                cy.get('#user-dialog-tabs').find('button').eq(1).click();

                cy.testInputValue(`#user_roles`, '');
                cy.get('[data-test="permission-checkbox"] input').each($el => {
                    expect($el).to.not.be.checked;
                });
            });
        });
        it('should display correct user infos', () => {
            goToPage();
            cy.wait('@getUsers').then(() => {
                const userIndex = 0;
                openDialogForUserIndex(userIndex);
                userInfosFields.forEach(f => {
                    cy.testInputValue(
                        `#input-text-${f}`,
                        listFixture.profiles[userIndex][f],
                    );
                });
                cy.testInputValue('#language', 'English');

                cy.testMultiSelect(
                    `#projects`,
                    listFixture.profiles[userIndex].projects,
                );
                cy.get('#user-dialog-tabs').find('button').eq(1).click();
                cy.get('#superuser-permission-message').should('be.visible');

                cy.get('.MuiDialogActions-root').find('button').first().click();
                openDialogForUserIndex(1);
                cy.get('#user-dialog-tabs').find('button').eq(1).click();
                cy.get('[data-test="permission-checkbox"] input').each($el => {
                    expect($el).to.not.be.checked;
                });
                cy.get('.MuiDialogActions-root').find('button').first().click();
                openDialogForUserIndex(2);
                cy.get('#user-dialog-tabs').find('button').eq(1).click();
                cy.get('#check-box-permission-checkbox-iaso_forms').should(
                    'be.checked',
                );
                cy.get('#user-dialog-tabs').find('button').eq(2).click();

                cy.get('.MuiTreeView-root').should(
                    'contain',
                    listFixture.profiles[2].org_units[0].name,
                );
            });
        });

        it('should call api list and api save', () => {
            goToPage();
            cy.wait('@getUsers').then(() => {
                const userIndex = 2;
                openDialogForUserIndex(userIndex);
                const userName = 'superman';
                cy.get('#input-text-user_name').clear().type(userName);
                cy.testInputValue('#input-text-user_name', userName);
                interceptFlag = false;
                cy.intercept(
                    {
                        method: 'PATCH',
                        pathname: `/api/profiles/${listFixture.profiles[userIndex].id}/`,
                    },
                    req => {
                        interceptFlag = true;
                        req.reply({
                            statusCode: 200,
                            body: listFixture.profiles[userIndex],
                        });
                    },
                ).as('saveUser');

                let interceptFlagUsers = false;
                cy.intercept(
                    {
                        method: 'GET',
                        pathname: '/api/profiles',
                        query: defaultQuery,
                    },
                    req => {
                        interceptFlagUsers = true;
                        req.reply({
                            statusCode: 200,
                            body: listFixture.profiles[userIndex],
                        });
                    },
                ).as('getUsersAfterSave');
                cy.get('.MuiDialogActions-root').find('button').last().click();
                cy.wait('@saveUser').then(() => {
                    cy.wrap(interceptFlag).should('eq', true);
                });
                cy.wait('@getUsersAfterSave').then(() => {
                    cy.wrap(interceptFlagUsers).should('eq', true);
                });
            });
        });
    });

    describe('api', () => {
        it('should be called with base params', () => {
            goToPage(superUser, {}, emptyFixture);
            cy.wait('@getUsers').then(() => {
                cy.wrap(interceptFlag).should('eq', true);
            });
        });
        it('should be called with search params', () => {
            goToPage(superUser, {}, emptyFixture);
            cy.wait('@getUsers').then(() => {
                interceptFlag = false;
                cy.intercept('GET', '/api/profiles/**/*', req => {
                    req.continue(res => {
                        interceptFlag = true;
                        res.send({ fixture: emptyFixture });
                    });
                }).as('getUsersSearch');

                cy.get('#search-search').type(search);
                cy.fillMultiSelect('#permissions', [0, 1], false);
                cy.fillSingleSelect('#orgUnitTypes', 1);
                cy.fillMultiSelect('#projectsIds', [0, 1], false);
                cy.fillMultiSelect('#userRoles', [0, 1], false);
                cy.fillTreeView(
                    '#ou-tree-input',
                    orgUnitTreeIndexSearch,
                    false,
                );
                cy.fillMultiSelect('#teamsIds', [0, 1], false);

                cy.get('[data-test="search-button"]').click();
                cy.wait('@getUsersSearch').then(xhr => {
                    cy.wrap(interceptFlag).should('eq', true);
                    console.log('query', JSON.stringify(xhr.request.query));
                    cy.wrap(xhr.request.query).should('deep.equal', {
                        limit: '20',
                        location: '3',
                        managedUsersOnly: 'true',
                        order: 'user__username',
                        orgUnitTypes: '11',
                        page: '1',
                        permissions: 'iaso_assignments,iaso_polio_budget',
                        projects: '1,2',
                        search: 'ZELDA',
                        teams: '25,26',
                        userRoles: '5,8',
                    });
                });
            });
        });
    });
});
