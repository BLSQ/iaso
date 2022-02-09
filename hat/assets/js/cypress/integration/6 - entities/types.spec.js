/// <reference types="cypress" />

import listFixture from '../../fixtures/entityTypes/list-paginated.json';
import superUser from '../../fixtures/profiles/me/superuser.json';

const siteBaseUrl = Cypress.env('siteBaseUrl');

const search = 'mario';
const baseUrl = `${siteBaseUrl}/dashboard/entities/types`;

let interceptFlag = false;
const emptyFixture = 'entityTypes/empty.json';
let table;
let row;
const defautlQuery = {
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
    const options = {
        method: 'GET',
        pathname: '/api/entitytype',
    };
    const query = {
        ...defautlQuery,
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
    const editButton = actionCol.find('button').eq(0);
    editButton.click();
    cy.get('#entity-types-dialog').should('be.visible');
};
describe('Entities', () => {
    describe('Page', () => {
        it('should redirect to url with pagination params', () => {
            goToPage();

            cy.wait('@getEntitiesTypes').then(() => {
                cy.url().should(
                    'eq',
                    `${baseUrl}/order/name/pageSize/20/page/1`,
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
            errorCode.should('contain', '401');
        });
    });

    describe('Search field', () => {
        beforeEach(() => {
            goToPage();
        });
        it('should enabled search button', () => {
            cy.wait('@getEntitiesTypes').then(() => {
                cy.get('#search-search').type(search);
                cy.get('#search-button')
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
                cy.get('#search-button')
                    .invoke('attr', 'disabled')
                    .should('equal', 'disabled');
            });
        });
        it('should be enabled while searching', () => {
            cy.get('#search-search').type(search);
            cy.wait('@getEntitiesTypes').then(() => {
                cy.get('#search-button')
                    .invoke('attr', 'disabled')
                    .should('equal', undefined);
            });
        });
        it('action should deep link search', () => {
            cy.wait('@getEntitiesTypes').then(() => {
                cy.get('#search-search').type(search);

                cy.get('#search-button').click();
                cy.url().should('contain', `${baseUrl}/search/${search}`);
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
                cy.get('@table').find('tbody').find('tr').eq(0).as('row');
                cy.get('@row').find('td').last().as('actionCol');
                cy.get('@actionCol').find('button').should('have.length', 2);
                cy.get('@actionCol').find('#form-link').should('not.exist');
                cy.get('@actionCol').find('#edit-button').should('be.visible');
                cy.get('@actionCol')
                    .find('#delete-button')
                    .should('be.visible');

                cy.log('Type only editable');
                cy.get('@table').find('tbody').find('tr').eq(1).as('row');
                cy.get('@row').find('td').last().as('actionCol');
                cy.get('@actionCol').find('button').should('have.length', 1);
                cy.get('@actionCol').find('#form-link').should('not.exist');
                cy.get('@actionCol').find('#edit-button').should('be.visible');
                cy.get('@actionCol').find('#delete-button').should('not.exist');

                cy.log('Type with form link');
                cy.get('@table').find('tbody').find('tr').eq(3).as('row');
                cy.get('@row').find('td').last().as('actionCol');
                cy.get('@actionCol').find('button').should('have.length', 2);
                cy.get('@actionCol').find('#form-link').should('be.visible');
                cy.get('@actionCol').find('#edit-button').should('be.visible');
                cy.get('@actionCol').find('#delete-button').should('not.exist');
            });
        });
    });

    describe('Dialog', () => {
        it.skip('should display empty entity infos', () => {
            // this will be tested when creation will be enabled
            goToPage();
            cy.wait('@getEntitiesTypes').then(() => {
                cy.get('#add-button-container').find('button').click();
                cy.get('#entity-types-dialog').should('be.visible');

                cy.testInputValue('#input-text-name', '');
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
                interceptFlag = false;
                cy.intercept(
                    {
                        method: 'PATCH',
                        pathname: `/api/entitytype/${listFixture.types[entityTypeIndex].id}/`,
                    },
                    req => {
                        interceptFlag = true;
                        req.reply({
                            statusCode: 200, // default
                            body: listFixture.types[entityTypeIndex],
                        });
                    },
                ).as('saveEntityType');

                let interceptFlagEntities = false;
                cy.intercept(
                    {
                        method: 'GET',
                        pathname: '/api/entitytype',
                        query: defautlQuery,
                    },
                    req => {
                        interceptFlagEntities = true;
                        req.reply({
                            statusCode: 200, // default
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
            const deleteButton = actionCol.find('button').last();
            deleteButton.click();
            cy.get('#delete-dialog-entityType').as('deleteDialog');
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
                        pathname: `/api/entitytype/${listFixture.types[entityTypeIndex].id}/`,
                    },
                    req => {
                        interceptFlag = true;
                        req.reply({
                            statusCode: 200, // default
                        });
                    },
                ).as('deleteEntityType');
                let interceptFlagEntities = false;
                cy.intercept(
                    {
                        method: 'GET',
                        pathname: '/api/entitytype',
                        query: defautlQuery,
                    },
                    req => {
                        interceptFlagEntities = true;
                        req.reply({
                            statusCode: 200, // default
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
                        pathname: '/api/entitytype',
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
                cy.get('#search-button').click();
                cy.wait('@getEntitySearch').then(() => {
                    cy.wrap(interceptFlag).should('eq', true);
                });
            });
        });
    });
});
