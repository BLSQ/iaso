/// <reference types="cypress" />

import listFixture from '../../fixtures/entityTypes/list-paginated.json';
import superUser from '../../fixtures/profiles/me/superuser.json';
import formDetail from '../../fixtures/forms/detail.json';
import formsList from '../../fixtures/forms/list.json';
import * as Permission from '../../../apps/Iaso/utils/permissions.ts';

const siteBaseUrl = Cypress.env('siteBaseUrl');

const search = 'mario';
const baseUrl = `${siteBaseUrl}/dashboard/entities/types`;

let interceptFlag = false;
const emptyFixture = 'entityTypes/empty.json';
let table;
let row;
const defaultQuery = {
    limit: '20',
    order: 'name',
    page: '1',
};
const goToPage = (
    fakeUser = superUser,
    formQuery,
    fixture = 'entityTypes/list-paginated.json',
) => {
    cy.login();
    interceptFlag = false;
    cy.intercept('GET', '/sockjs-node/**');
    cy.intercept('GET', '/api/profiles/me/**', fakeUser);
    cy.intercept('GET', '/api/forms/7/**', formDetail);
    cy.intercept('GET', '/api/forms/?fields=id,name', formsList);
    const options = {
        method: 'GET',
        pathname: '/api/entitytypes',
    };
    const query = {
        ...defaultQuery,
        ...formQuery,
    };
    cy.intercept({ ...options, query }, req => {
        req.continue(res => {
            interceptFlag = true;
            res.send({ fixture });
        });
    }).as('getEntitiesTypes');
    cy.visit(baseUrl);
};

const openDialogForIndex = index => {
    table = cy.get('table');
    row = table.find('tbody').find('tr').eq(index);
    const actionCol = row.find('td').last();
    const editButton = actionCol.find('[data-test=edit-button]');
    editButton.click();
    cy.get('#entity-types-dialog').should('be.visible');
};
describe('Entities types', () => {
    describe('Page', () => {
        it('should redirect to url with pagination params', () => {
            goToPage();

            cy.wait('@getEntitiesTypes').then(() => {
                cy.url().should(
                    'eq',
                    `${baseUrl}/accountId/1/order/name/pageSize/20/page/1`,
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
        });
        it('should enabled search button', () => {
            cy.wait('@getEntitiesTypes').then(() => {
                cy.get('#search-search').type(search);
                cy.get('[data-test="search-button"]')
                    .invoke('attr', 'disabled')
                    .should('equal', undefined);
            });
        });
    });

    describe('Search button', () => {
        beforeEach(() => {
            goToPage();
        });
        it('should be disabled', () => {
            cy.wait('@getEntitiesTypes').then(() => {
                cy.get('[data-test="search-button"]')
                    .invoke('attr', 'disabled')
                    .should('equal', 'disabled');
            });
        });
        it('should be enabled while searching', () => {
            cy.get('#search-search').type(search);
            cy.wait('@getEntitiesTypes').then(() => {
                cy.get('[data-test="search-button"]')
                    .invoke('attr', 'disabled')
                    .should('equal', undefined);
            });
        });
        it('action should deep link search', () => {
            cy.wait('@getEntitiesTypes', { timeout: 10000 }).then(() => {
                cy.get('#search-search').type(search);

                cy.get('[data-test="search-button"]').click();
                cy.url().should('contain', `/search/${search}`);
            });
        });
    });

    describe('Table', () => {
        it('should render results', () => {
            goToPage();
            cy.wait('@getEntitiesTypes').then(() => {
                table = cy.get('table');
                table.should('have.length', 1);
                const rows = table.find('tbody').find('tr');
                rows.should('have.length', listFixture.types.length);
                rows.eq(0).find('td').should('have.length', 5);
            });
        });
        it('should display correct amount of buttons on action column', () => {
            goToPage();
            cy.wait('@getEntitiesTypes').then(() => {
                cy.get('table').as('table');

                cy.log('Type deletable');
                let rowIndex = 0;
                cy.get('@table')
                    .find('tbody')
                    .find('tr')
                    .eq(rowIndex)
                    .as('row');
                cy.get('@row').find('td').last().as('actionCol');
                cy.get('@actionCol').find('button').should('have.length', 5);
                cy.get('@actionCol')
                    .find(`#form-link-${listFixture.types[rowIndex].id}`)
                    .should('be.visible');
                cy.get('@actionCol')
                    .find(`#workflow-link-${listFixture.types[rowIndex].id}`)
                    .should('be.visible');
                cy.get('@actionCol')
                    .find(`#edit-button-${listFixture.types[rowIndex].id}`)
                    .should('be.visible');
                cy.get('@actionCol')
                    .find(
                        `#delete-button-entityType-${listFixture.types[rowIndex].id}`,
                    )
                    .should('be.visible');

                cy.log('Type only editable');
                rowIndex = 1;
                cy.get('@table')
                    .find('tbody')
                    .find('tr')
                    .eq(rowIndex)
                    .as('row');
                cy.get('@row').find('td').last().as('actionCol');
                cy.get('@actionCol').find('button').should('have.length', 3);
                cy.get('@actionCol')
                    .find(`#form-link-${listFixture.types[rowIndex].id}`)
                    .should('not.exist');
                cy.get('@actionCol')
                    .find(`#workflow-link-${listFixture.types[rowIndex].id}`)
                    .should('be.visible');
                cy.get('@actionCol')
                    .find(`#edit-button-${listFixture.types[rowIndex].id}`)
                    .should('be.visible');
                cy.get('@actionCol')
                    .find(
                        `#delete-button-entityType-${listFixture.types[rowIndex].id}`,
                    )
                    .should('not.exist');

                rowIndex = 3;
                cy.log('Type with form link');
                cy.get('@table')
                    .find('tbody')
                    .find('tr')
                    .eq(rowIndex)
                    .as('row');
                cy.get('@row').find('td').last().as('actionCol');
                cy.get('@actionCol').find('button').should('have.length', 4);
                cy.get('@actionCol')
                    .find(`#form-link-${listFixture.types[rowIndex].id}`)
                    .should('be.visible');
                cy.get('@actionCol')
                    .find(`#workflow-link-${listFixture.types[rowIndex].id}`)
                    .should('be.visible');
                cy.get('@actionCol')
                    .find(`#edit-button-${listFixture.types[rowIndex].id}`)
                    .should('be.visible');
                cy.get('@actionCol')
                    .find(
                        `#delete-button-entityType-${listFixture.types[rowIndex].id}`,
                    )
                    .should('not.exist');
            });
        });
    });

    describe('Dialog', () => {
        it('should display empty entity infos', () => {
            goToPage();
            cy.wait('@getEntitiesTypes').then(() => {
                cy.get('[data-test="add-entity-button"]').click();
                cy.get('#entity-types-dialog').should('be.visible');

                cy.testInputValue('#input-text-name', '');
                cy.testMultiSelect('#reference_form', []);
                cy.testMultiSelect('#fields_detail_info_view', []);
                cy.testMultiSelect('#fields_list_view', []);
                cy.testMultiSelect('#fields_duplicate_search', []);
                cy.get('[data-test="see-form-button"]').should('not.exist');
            });
        });
        it('should display correct entity infos', () => {
            goToPage();
            cy.wait('@getEntitiesTypes').then(() => {
                const entityTypeIndex = 0;
                openDialogForIndex(entityTypeIndex);

                cy.testInputValue(
                    '#input-text-name',
                    listFixture.types[entityTypeIndex].name,
                );
                cy.get('[data-test="see-form-button"]').should('be.visible');
                cy.get('#reference_form').should('not.exist');
                cy.testMultiSelect('#fields_detail_info_view', [
                    { name: 'Date' },
                    { name: 'Nom' },
                ]);
                cy.testMultiSelect('#fields_list_view', [
                    { name: 'Date' },
                    { name: 'Nom' },
                ]);
            });
        });

        it('should call api list and api save', () => {
            goToPage();
            cy.wait('@getEntitiesTypes').then(() => {
                const entityTypeIndex = 0;
                openDialogForIndex(entityTypeIndex);
                const name = 'superman';
                cy.get('#input-text-name').clear().type(name);
                cy.testInputValue('#input-text-name', name);
                cy.fillMultiSelect('#fields_list_view', [2, 3]);
                cy.fillMultiSelect('#fields_detail_info_view', [2, 3]);
                cy.fillMultiSelect('#fields_duplicate_search', [2], false);
                interceptFlag = false;
                cy.intercept(
                    {
                        method: 'PATCH',
                        pathname: `/api/entitytypes/${listFixture.types[entityTypeIndex].id}/`,
                    },
                    req => {
                        expect(req.body).to.deep.equal({
                            ...listFixture.types[entityTypeIndex],
                            fields_detail_info_view: ['firstname', 'name'],
                            fields_list_view: ['firstname', 'name'],
                            fields_duplicate_search: ['firstname'],
                            name,
                        });
                        interceptFlag = true;
                        req.reply({
                            statusCode: 200,
                            body: listFixture.types[entityTypeIndex],
                        });
                    },
                ).as('saveEntityType');

                let interceptFlagEntities = false;
                cy.intercept(
                    {
                        method: 'GET',
                        pathname: '/api/entitytypes',
                        query: defaultQuery,
                    },
                    req => {
                        interceptFlagEntities = true;
                        req.reply({
                            statusCode: 200,
                            body: listFixture.types[entityTypeIndex],
                        });
                    },
                ).as('getEntitiesTypesAfterSave');
                cy.get('.MuiDialogActions-root').find('button').last().click();
                cy.wait('@saveEntityType').then(() => {
                    cy.wrap(interceptFlag).should('eq', true);
                });
                cy.wait('@getEntitiesTypesAfterSave').then(() => {
                    cy.wrap(interceptFlagEntities).should('eq', true);
                });
            });
        });
    });

    describe('Delete a row', () => {
        beforeEach(() => {
            goToPage();
            const entityTypeIndex = 0;
            table = cy.get('table');
            row = table.find('tbody').find('tr').eq(entityTypeIndex);
            const actionCol = row.find('td').last();
            const deleteButton = actionCol.find('button').eq(3);
            deleteButton.click();
            cy.get('#delete-dialog-entityType-7').as('deleteDialog');
        });
        it('should open delete dialog', () => {
            cy.wait('@getEntitiesTypes').then(() => {
                cy.get('@deleteDialog').should('be.visible');
            });
        });
        it('should delete entity type on confirm', () => {
            cy.wait('@getEntitiesTypes').then(() => {
                interceptFlag = false;
                const entityTypeIndex = 0;
                cy.intercept(
                    {
                        method: 'DELETE',
                        pathname: `/api/entitytypes/${listFixture.types[entityTypeIndex].id}/`,
                    },
                    req => {
                        interceptFlag = true;
                        req.reply({
                            statusCode: 200,
                        });
                    },
                ).as('deleteEntityType');
                let interceptFlagEntities = false;
                cy.intercept(
                    {
                        method: 'GET',
                        pathname: '/api/entitytypes',
                        query: defaultQuery,
                    },
                    req => {
                        interceptFlagEntities = true;
                        req.reply({
                            statusCode: 200,
                            body: listFixture.types[entityTypeIndex],
                        });
                    },
                ).as('getEntitiesTypesAfterDelete');
                cy.get('@deleteDialog')
                    .parent()
                    .parent()
                    .find('button')
                    .last()
                    .click();
                cy.wait('@deleteEntityType').then(() => {
                    cy.wrap(interceptFlag).should('eq', true);
                });
                cy.wait('@getEntitiesTypesAfterDelete').then(() => {
                    cy.wrap(interceptFlagEntities).should('eq', true);
                });
            });
        });
        it('should close delete dialog on cancel', () => {
            cy.wait('@getEntitiesTypes').then(() => {
                cy.get('@deleteDialog')
                    .parent()
                    .parent()
                    .find('button')
                    .first()
                    .click();
                cy.get('#delete-dialog-entityType').should('not.exist');
            });
        });
    });

    it('User wihtout write access should not be able to create,edit or delete a type', () => {
        const unauthorizedUser = {
            ...superUser,
            permissions: [Permission.ENTITIES],
            is_superuser: false,
        };
        goToPage(unauthorizedUser);
        cy.wait('@getEntitiesTypes').then(() => {
            cy.get('[data-test="add-entity-button"]').should('not.exist');

            cy.get('table').as('table');

            cy.get('#delete-button-entityType-7').should('not.exist');

            cy.get('@table').find('tbody').find('tr').eq(0).as('row');
            cy.get('@row').find('td').last().as('actionCol');
            cy.get('@actionCol').find('button').should('have.length', 3);

            cy.get('@table').find('tbody').find('tr').eq(1).as('row');
            cy.get('@row').find('td').last().as('actionCol');
            cy.get('@actionCol').find('button').should('have.length', 2);

            cy.log('Type with form link');
            cy.get('@table').find('tbody').find('tr').eq(3).as('row');
            cy.get('@row').find('td').last().as('actionCol');
            cy.get('@actionCol').find('button').should('have.length', 3);
        });
    });

    describe('Api', () => {
        it('should be called with base params', () => {
            goToPage(superUser, {}, emptyFixture);
            cy.wait('@getEntitiesTypes').then(() => {
                cy.wrap(interceptFlag).should('eq', true);
            });
        });
        it('should be called with search params', () => {
            goToPage(superUser, {}, emptyFixture);
            cy.wait('@getEntitiesTypes').then(() => {
                interceptFlag = false;
                cy.intercept(
                    {
                        method: 'GET',
                        pathname: '/api/entitytypes',
                        query: {
                            limit: '20',
                            order: 'name',
                            page: '1',
                            search,
                        },
                    },
                    req => {
                        req.continue(res => {
                            interceptFlag = true;
                            res.send({ fixture: emptyFixture });
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
