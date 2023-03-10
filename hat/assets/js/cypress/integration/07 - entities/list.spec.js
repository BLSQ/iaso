/// <reference types="cypress" />

import listFixture from '../../fixtures/entities/list.json';
import superUser from '../../fixtures/profiles/me/superuser.json';
import { testSearchField } from '../../support/testSearchField';
import { search, searchWithForbiddenChars } from '../../constants/search';

const siteBaseUrl = Cypress.env('siteBaseUrl');
const baseUrl = `${siteBaseUrl}/dashboard/entities/list`;

let interceptFlag = false;
const emptyFixture = 'entities/empty.json';
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
    fixture = 'entities/list.json',
) => {
    cy.login();
    interceptFlag = false;
    cy.intercept('GET', '/sockjs-node/**');
    cy.intercept('GET', '/api/profiles/me/**', fakeUser);
    cy.intercept('GET', '/api/entitytypes', {
        fixture: 'entityTypes/list.json',
    }).as('getEntitiesTypes');
    const options = {
        method: 'GET',
        pathname: '/api/entities',
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
    }).as('getEntities');
    cy.visit(baseUrl);
};

const openDialogForEntityIndex = index => {
    table = cy.get('table');
    row = table.find('tbody').find('tr').eq(index);
    const actionCol = row.find('td').last();
    const editButton = actionCol.find('button').eq(1);
    editButton.click();
    cy.get('#entity-dialog').should('be.visible');
};
describe.skip('Entities', () => {
    describe('Page', () => {
        it('should redirect to url with pagination params', () => {
            goToPage();

            cy.wait('@getEntities').then(() => {
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
            errorCode.should('contain', '401');
        });
    });

    describe('Search field', () => {
        beforeEach(() => {
            goToPage();
        });
        testSearchField(search, searchWithForbiddenChars);
    });

    describe('Search button', () => {
        beforeEach(() => {
            goToPage();
        });
        it('should be disabled', () => {
            cy.wait('@getEntities').then(() => {
                cy.get('[data-test="search-button"]')
                    .invoke('attr', 'disabled')
                    .should('equal', 'disabled');
            });
        });
        it('should be enabled while searching', () => {
            cy.get('#search-search').type(search);
            cy.wait('@getEntities').then(() => {
                cy.get('[data-test="search-button"]')
                    .invoke('attr', 'disabled')
                    .should('equal', undefined);
            });
        });
        // skipping until we figure how to articulate entities and beneficiaries
        it.skip('action should deep link search', () => {
            cy.wait('@getEntities').then(() => {
                cy.wait('@getEntitiesTypes').then(() => {
                    cy.get('#search-search').type(search);
                    cy.fillSingleSelect('#entityTypes', 0);

                    cy.get('[data-test="search-button"]').click();
                    cy.url().should(
                        'contain',
                        `${baseUrl}/accountId/1/search/${search}/entityTypes/1`,
                    );
                });
            });
        });
    });

    describe('Table', () => {
        it('should render results', () => {
            goToPage();
            cy.wait('@getEntities').then(() => {
                table = cy.get('table');
                table.should('have.length', 1);
                const rows = table.find('tbody').find('tr');
                rows.should('have.length', listFixture.entities.length);
                rows.eq(0).find('td').should('have.length', 5);
            });
        });

        it('should display correct amount of buttons on action column', () => {
            goToPage();
            cy.wait('@getEntities').then(() => {
                table = cy.get('table');
                row = table.find('tbody').find('tr').eq(1);
                const actionCol = row.find('td').last();
                actionCol.find('button').should('have.length', 3);
            });
        });
    });

    describe('Dialog', () => {
        it.skip('should display empty entity infos', () => {
            // this will be tested when creation will be enabled
            goToPage();
            cy.wait('@getEntities').then(() => {
                cy.get('[data-test="add-entity-button"]').click();
                cy.get('#entity-dialog').should('be.visible');

                cy.testInputValue('#input-text-name', '');
                cy.testInputValue('#entity_type', '');
            });
        });
        it('should display correct entity infos', () => {
            goToPage();
            cy.wait('@getEntities').then(() => {
                const entityIndex = 0;
                openDialogForEntityIndex(entityIndex);

                cy.testInputValue(
                    '#input-text-name',
                    listFixture.entities[entityIndex].name,
                );
                cy.testInputValue(
                    '#entity_type',
                    listFixture.entities[entityIndex].entity_type_name,
                );
            });
        });

        it('should call api list and api save', () => {
            goToPage();
            cy.wait('@getEntities').then(() => {
                const entityIndex = 0;
                openDialogForEntityIndex(entityIndex);
                const name = 'superman';
                cy.get('#input-text-name').clear().type(name);
                cy.testInputValue('#input-text-name', name);
                interceptFlag = false;
                cy.intercept(
                    {
                        method: 'PATCH',
                        pathname: `/api/entities/${listFixture.entities[entityIndex].id}/`,
                    },
                    req => {
                        interceptFlag = true;
                        req.reply({
                            statusCode: 200,
                            body: listFixture.entities[entityIndex],
                        });
                    },
                ).as('saveEntity');

                let interceptFlagEntities = false;
                cy.intercept(
                    {
                        method: 'GET',
                        pathname: '/api/entities',
                        query: defaultQuery,
                    },
                    req => {
                        interceptFlagEntities = true;
                        req.reply({
                            statusCode: 200,
                            body: listFixture.entities[entityIndex],
                        });
                    },
                ).as('getEntitiesAfterSave');
                cy.get('.MuiDialogActions-root').find('button').last().click();
                cy.wait('@saveEntity').then(() => {
                    cy.wrap(interceptFlag).should('eq', true);
                });
                cy.wait('@getEntitiesAfterSave').then(() => {
                    cy.wrap(interceptFlagEntities).should('eq', true);
                });
            });
        });
    });

    describe('Delete a row', () => {
        beforeEach(() => {
            goToPage();
            const entityIndex = 0;
            table = cy.get('table');
            row = table.find('tbody').find('tr').eq(entityIndex);
            const actionCol = row.find('td').last();
            const deleteButton = actionCol.find('button').last();
            deleteButton.click();
            cy.get('#delete-dialog-entity').as('deleteDialog');
        });
        it('should open delete dialog', () => {
            cy.wait('@getEntities').then(() => {
                cy.get('@deleteDialog').should('be.visible');
            });
        });
        it('should delete entity on confirm', () => {
            cy.wait('@getEntities').then(() => {
                interceptFlag = false;
                const entityIndex = 0;
                cy.intercept(
                    {
                        method: 'DELETE',
                        pathname: `/api/entities/${listFixture.entities[entityIndex].id}/`,
                    },
                    req => {
                        interceptFlag = true;
                        req.reply({
                            statusCode: 200,
                        });
                    },
                ).as('deleteEntity');
                let interceptFlagEntities = false;
                cy.intercept(
                    {
                        method: 'GET',
                        pathname: '/api/entities',
                        query: defaultQuery,
                    },
                    req => {
                        interceptFlagEntities = true;
                        req.reply({
                            statusCode: 200,
                            body: listFixture.entities[entityIndex],
                        });
                    },
                ).as('getEntitiesAfterDelete');
                cy.get('@deleteDialog')
                    .parent()
                    .parent()
                    .find('button')
                    .last()
                    .click();
                cy.wait('@deleteEntity').then(() => {
                    cy.wrap(interceptFlag).should('eq', true);
                });
                cy.wait('@getEntitiesAfterDelete').then(() => {
                    cy.wrap(interceptFlagEntities).should('eq', true);
                });
            });
        });
        it('should close delete dialog on cancel', () => {
            cy.wait('@getEntities').then(() => {
                cy.get('@deleteDialog')
                    .parent()
                    .parent()
                    .find('button')
                    .first()
                    .click();
                cy.get('#delete-dialog-entity').should('not.exist');
            });
        });
    });

    describe('Api', () => {
        it('should be called with base params', () => {
            goToPage(superUser, {}, emptyFixture);
            cy.wait('@getEntities').then(() => {
                cy.wrap(interceptFlag).should('eq', true);
            });
        });
        // Skipping because of interference of WFP beneficiaries. Should be sorted out before fixing/re-activating the test
        it.skip('should be called with search params', () => {
            goToPage(superUser, {}, emptyFixture);
            cy.wait('@getEntities').then(() => {
                interceptFlag = false;
                cy.intercept(
                    {
                        method: 'GET',
                        pathname: '/api/entities',
                        query: {
                            limit: '20',
                            order: 'name',
                            page: '1',
                            search,
                            entity_types__ids: '2',
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
                cy.fillSingleSelect('#entityTypes', 1);
                cy.get('[data-test="search-button"]').click();
                cy.wait('@getEntitySearch').then(() => {
                    cy.wrap(interceptFlag).should('eq', true);
                });
            });
        });
    });
});
