/// <reference types='cypress' />

import superUser from '../../fixtures/profiles/me/superuser.json';
import { testPagination } from '../../support/testPagination';
import { testPermission } from '../../support/testPermission';
import { testTablerender } from '../../support/testTableRender';
import { testTopBar } from '../../support/testTopBar';
import orgUnitTypes from '../../fixtures/orgunittypes/page1_limit20.json';
import outypesList from '../../fixtures/orgunittypes/dummy-list.json';

const siteBaseUrl = Cypress.env('siteBaseUrl');

const baseUrl = `${siteBaseUrl}/dashboard/orgunits/types/order/name/pageSize/20/page/1`;

// TODO populate list
const interceptList = ['profiles', 'projects', 'forms'];

describe('Org unit types', () => {
    beforeEach(() => {
        cy.login();
        cy.intercept('GET', '/sockjs-node/**');
        cy.intercept('GET', '/api/v2/orgunittypes/', outypesList);
        interceptList.forEach(i => {
            cy.intercept('GET', `/api/${i}/**`, {
                fixture: `${i}/list.json`,
            });
        });
        cy.intercept(
            {
                pathname: '/api/v2/orgunittypes/**',
                query: {
                    order: 'name',
                    limit: '20',
                    page: '1',
                },
            },
            {
                fixture: 'orgunittypes/page1_limit20.json',
            },
        ).as('getOrgUnitTypes');
        cy.intercept(
            {
                pathname: '/api/v2/orgunittypes/**',
                query: {
                    order: 'name',
                    limit: '20',
                    page: '2',
                },
            },
            {
                fixture: 'orgunittypes/page1_limit20.json',
            },
        );
        cy.intercept('GET', '/api/profiles/me/**', superUser);
    });

    describe('When mounting', () => {
        testPermission(baseUrl);
        testTopBar(baseUrl, 'Org unit types', false);
        describe('Table', () => {
            beforeEach(() => {
                cy.visit(baseUrl);
                cy.wait('@getOrgUnitTypes');
            });

            testTablerender({
                baseUrl,
                rows: 20,
                columns: 9,
                apiKey: 'v2/orgunittypes',
                responseKey: 'orgUnitTypes',
                withVisit: false,
            });
            testPagination({
                baseUrl,
                apiPath: '/api/v2/orgunittypes/**',
                apiKey: 'orgUnitTypes',
                withSearch: false,
                fixture: orgUnitTypes,
            });
        });
        describe('"Create" button', () => {
            beforeEach(() => {
                cy.visit(baseUrl);
                cy.wait('@getOrgUnitTypes');
                cy.get('#create-ou-type').as('create-button');
            });
            it('exists', () => {
                cy.get('@create-button').should('exist');
            });
            it('opens modal', () => {
                cy.get('@create-button')
                    .click()
                    .then(() => {
                        cy.getAndAssert('#OuTypes-modal', 'modal');
                    });
            });
            it('has all modal fields empty', () => {
                cy.get('@create-button')
                    .click()
                    .then(() => {
                        cy.get('#OuTypes-modal')
                            .as('modal')
                            .then(() => {
                                cy.testInputValue('#input-text-name', '');
                                cy.testInputValue('#input-text-short_name', '');
                                cy.testInputValue('#input-text-depth', '0');
                                cy.testMultiSelect('#sub_unit_type_ids', []);
                                cy.testMultiSelect('#project_ids', []);
                                cy.testMultiSelect('#reference_forms_ids', []);
                            });
                    });
            });
        });
        it('displays tooltip when hovering over info icon', () => {
            cy.visit(baseUrl);
            cy.wait('@getOrgUnitTypes');
            cy.findTableHead(4).find('svg').eq(0).as('icon');
            cy.assertTooltipDiplay('icon');
        });
        describe('edit button', () => {
            beforeEach(() => {
                cy.visit(baseUrl);
                cy.wait('@getOrgUnitTypes');
                cy.get('#edit-button-1').as('editIcon');
            });
            it('exists', () => {
                cy.get('@editIcon').should('exist');
            });
            it('displays tooltip when hovering', () => {
                cy.assertTooltipDiplay('editIcon');
            });
            it('opens modal when clicked', () => {
                cy.get('@editIcon')
                    .click()
                    .then(() => {
                        cy.getAndAssert('#OuTypes-modal', 'modal');
                    });
            });
            it('prefills modal with OU type data', () => {
                cy.get('@editIcon')
                    .click()
                    .then(() => {
                        cy.get('#OuTypes-modal')
                            .as('modal')
                            .then(() => {
                                cy.testInputValue('#input-text-name', 'Type1');
                                cy.testInputValue(
                                    '#input-text-short_name',
                                    'T1',
                                );
                                cy.testInputValue('#input-text-depth', '2');
                                cy.testMultiSelect(
                                    '#sub_unit_type_ids',
                                    outypesList.orgUnitTypes[0].sub_unit_types,
                                );
                                cy.testMultiSelect(
                                    '#project_ids',
                                    outypesList.orgUnitTypes[0].projects,
                                );
                                cy.testMultiSelect(
                                    '#reference_forms_ids',
                                    outypesList.orgUnitTypes[0].reference_forms,
                                );
                            });
                    });
            });
        });
        // This test assumes the first type in the fixture has org units, and the second doesn't
        // It also assumes the type ids are in in descending order
        describe('delete button', () => {
            it('displays tooltip when hovering type with no org units', () => {
                cy.visit(baseUrl);
                cy.wait('@getOrgUnitTypes');
                // This is going to be fail if the structure of the button changes and the aria-describedby attribute moves to the eg the underlying svg
                cy.get('#delete-button-2').as('deleteIcon');
                cy.assertTooltipDiplay('deleteIcon');
            });
            it('does not display tooltip when hovering type with org units', () => {
                cy.visit(baseUrl);
                cy.wait('@getOrgUnitTypes');
                cy.get('#delete-button-1').as('deleteIcon');
                const deleteIcon = cy.get(`@deleteIcon`);
                deleteIcon.should('exist');
                deleteIcon.trigger('mouseover');
                deleteIcon
                    .invoke('attr', 'aria-describedby')
                    .should('not.exist');
            });
            it('is disabled when type has org units', () => {
                cy.visit(baseUrl);
                cy.wait('@getOrgUnitTypes');
                cy.get('#delete-button-1').as('deleteIcon');
                const deleteIcon = cy.get(`@deleteIcon`);
                deleteIcon.should('exist');
                deleteIcon
                    .find('button')
                    .eq(0)
                    .invoke('attr', 'disabled')
                    .should('exist');
            });
            it('is enabled when type has no org units', () => {
                cy.visit(baseUrl);
                cy.wait('@getOrgUnitTypes');
                cy.get('#delete-button-2').as('deleteIcon');
                const deleteIcon = cy.get(`@deleteIcon`);
                deleteIcon.should('exist');
                deleteIcon
                    .find('button')
                    .eq(0)
                    .invoke('attr', 'disabled')
                    .should('not.exist');
            });
        });
        describe.skip('Modal', () => {
            beforeEach(() => {
                cy.visit(baseUrl);
                cy.wait('@getOrgUnitTypes');
                cy.get('#edit-button-1').as('editIcon');
                cy.get('@editIcon')
                    .click()
                    .then(() => {
                        cy.get('#OuTypes-modal').as('modal');
                    });
            });
            it('sends payload to API', () => {});
        });
    });
});
