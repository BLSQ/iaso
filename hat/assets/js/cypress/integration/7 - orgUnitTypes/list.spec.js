/// <reference types='cypress' />

import superUser from '../../fixtures/profiles/me/superuser.json';
import { testPagination } from '../../support/testPagination';
import { testPermission } from '../../support/testPermission';
import { testTablerender } from '../../support/testTableRender';
import { testTopBar } from '../../support/testTopBar';
import orgUnitTypes from '../../fixtures/orgunittypes/page1_limit20.json';

const siteBaseUrl = Cypress.env('siteBaseUrl');

const baseUrl = `${siteBaseUrl}/dashboard/orgunits/types/order/name/pageSize/20/page/1`;

// TODO populate list
const interceptList = ['profiles', 'projects'];

describe('Org unit types', () => {
    beforeEach(() => {
        cy.login();
        // cy.intercept('GET', '/sockjs-node/**');
        interceptList.forEach(i => {
            cy.intercept('GET', `/api/${i}/**`, {
                fixture: `${i}/list.json`,
            });
        });
        cy.intercept(
            {
                pathname: '/api/orgunittypes/**',
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
        cy.intercept('GET', '/api/profiles/me/**', superUser);
    });
    describe('When mounting', () => {
        testPermission(baseUrl);
        testTopBar(baseUrl, 'Organisation unit types', false);
        it('Displays "Create" button', () => {
            cy.visit(baseUrl);
            cy.wait('@getOrgUnitTypes');
            cy.get('#create-ou-type').should('exist');
        });
        testTablerender(baseUrl, 20, 8);
        it('displays tooltip when hovering over info icon', () => {
            cy.visit(baseUrl);
            cy.wait('@getOrgUnitTypes');
            cy.findTableHead(3).find('svg').eq(0).as('icon');
            cy.assertTooltipDiplay('icon');
        });
        testPagination({
            baseUrl,
            apiPath: '/api/orgunittypes/**',
            apiKey: 'orgUnitTypes',
            withSearch: false,
            fixture: orgUnitTypes,
        });
        describe('edit button', () => {
            it('displays tooltip when hovering', () => {
                cy.visit(baseUrl);
                cy.wait('@getOrgUnitTypes');
                cy.get('#edit-button-1').as('editIcon');
                cy.assertTooltipDiplay('editIcon');
            });
        });
        // This test assumes the first type in the fixture has org units, and the secoind doesn't
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
    });
});
