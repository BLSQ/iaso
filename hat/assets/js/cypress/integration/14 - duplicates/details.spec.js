/// <reference types="cypress" />

import superUser from '../../fixtures/profiles/me/superuser.json';
import duplicatesInfos from '../../fixtures/duplicates/list-details.json';

const siteBaseUrl = Cypress.env('siteBaseUrl');
const baseUrl = `${siteBaseUrl}/dashboard/entities/duplicates/details/accountId/1/entities/883,163`;

const mockPage = () => {
    cy.login();
    cy.intercept('GET', '/sockjs-node/**');
    cy.intercept('GET', '/api/profiles/me/**', {
        fixture: 'profiles/me/superuser.json',
    }).as('getProfile');
    cy.intercept('GET', '/api/entityduplicates/detail/?entities=883%2C163', {
        fixture: 'duplicates/details.json',
    }).as('getDetails');
    cy.intercept('GET', '/api/entityduplicates/?entities=883%2C163', {
        fixture: 'duplicates/list-details.json',
    }).as('getDetailsDuplicate');
    cy.intercept(
        'GET',
        '/api/instances/?order=-created_at&with_descriptor=true&entityId=163',
        {
            fixture: 'duplicates/instances-a.json',
        },
    );
    cy.intercept(
        'GET',
        '/api/instances/?order=-created_at&with_descriptor=true&entityId=883',
        {
            fixture: 'duplicates/instances-b.json',
        },
    );
};

const testCellStatus = (rowIndex, cellIndex, status) => {
    cy.get('@duplicateTableRows')
        .eq(rowIndex)
        .find('td')
        .eq(cellIndex)
        .invoke('attr', 'data-test')
        .should('equal', status);
};
const testCellIsEmpty = (rowIndex, cellIndex) => {
    cy.get('@duplicateTableRows')
        .eq(rowIndex)
        .find('td')
        .eq(cellIndex)
        .find('div')
        .should('be.empty');
};
const testCellContains = (rowIndex, cellIndex, stringToContain) => {
    cy.get('@duplicateTableRows')
        .eq(rowIndex)
        .find('td')
        .eq(cellIndex)
        .find('div')
        .should('contain', stringToContain);
};
describe('Workflows details', () => {
    it('page should not be accessible if user does not have permission', () => {
        const fakeUser = {
            ...superUser,
            permissions: [],
            is_superuser: false,
        };
        mockPage();
        cy.intercept('GET', '/api/profiles/me/**', fakeUser);
        cy.visit(baseUrl);
        const errorCode = cy.get('#error-code');
        errorCode.should('contain', '401');
    });

    it('should show correct infos', () => {
        mockPage();
        cy.visit(baseUrl);

        cy.wait(['@getDetails', '@getDetailsDuplicate']).then(() => {
            cy.url().should('eq', baseUrl);
            cy.get('[data-test="duplicate-infos"]').as('infos');
            cy.get('@infos')
                .find('h5')
                .should('contain', duplicatesInfos.results[0].form.name);
            cy.get('@infos').find('table').as('infoTable');
            cy.get('@infoTable')
                .find('tbody')
                .find('tr')
                .as('tableRows')
                .should('have.length', 5);
            cy.get('@tableRows').eq(0).find('td').should('have.length', 2);
            cy.get('@tableRows')
                .eq(0)
                .find('td')
                .eq(1)
                .find('[data-test="star-value"]')
                .should('have.attr', 'style', 'width: 40%;');
            cy.get('@tableRows')
                .eq(1)
                .find('td')
                .eq(1)
                .should('contain', '883,163');
            cy.get('@tableRows').eq(2).find('td').eq(1).should('contain', '1');
            cy.get('@tableRows')
                .eq(3)
                .find('td')
                .eq(1)
                .should('contain', 'levenshtein');
            cy.get('@tableRows').eq(4).find('td').eq(1).should('contain', '2');
            cy.get('[data-test="ignore-button"]')
                .invoke('attr', 'disabled')
                .should('equal', undefined);
            cy.get('[data-test="merge-button"]')
                .invoke('attr', 'disabled')
                .should('equal', 'disabled');

            cy.get('[data-test="duplicate-table"]')
                .find('table')
                .as('duplicateTable');

            cy.get('@duplicateTable')
                .find('tbody')
                .find('tr')
                .as('duplicateTableRows')
                .should('have.length', 3);

            testCellStatus(0, 1, 'diff');
            testCellStatus(0, 2, 'diff');
            testCellIsEmpty(0, 3);

            testCellStatus(1, 1, 'identical');
            testCellStatus(1, 2, 'identical');
            testCellContains(1, 3, 'Côté');

            testCellStatus(2, 1, 'identical');
            testCellStatus(2, 2, 'identical');
            testCellIsEmpty(2, 3);
        });
    });
    it.only('action buttons should change duplicate table state', () => {
        mockPage();
        cy.visit(baseUrl);

        cy.wait(['@getDetails', '@getDetailsDuplicate']).then(() => {
            cy.get('#check-box-onlyShowUnmatched').check();
            cy.get('[data-test="duplicate-table"]')
                .find('table')
                .as('duplicateTable');
            cy.get('@duplicateTable')
                .find('tbody')
                .find('[data-test="hidden-row"]')
                .should('have.length', 2);

            cy.get('@duplicateTable')
                .find('tbody')
                .find('[data-test="visible-row"]')
                .as('duplicateTableRows')
                .should('have.length', 1);

            testCellStatus(0, 1, 'diff');
            testCellStatus(0, 2, 'diff');
            testCellIsEmpty(0, 3);

            cy.get('[data-test="fill-value-a-button"]').click();
            testCellStatus(0, 1, 'selected');
            testCellStatus(0, 2, 'dropped');
            testCellContains(0, 3, 'Lauzon');
            cy.get('[data-test="merge-button"]')
                .invoke('attr', 'disabled')
                .should('equal', undefined);

            cy.get('[data-test="fill-value-b-button"]').click();
            testCellStatus(0, 1, 'dropped');
            testCellStatus(0, 2, 'selected');
            testCellContains(0, 3, 'Gagnon');
            cy.get('[data-test="merge-button"]')
                .invoke('attr', 'disabled')
                .should('equal', undefined);

            cy.get('[data-test="reset-button"]').click();
            testCellStatus(0, 1, 'diff');
            testCellStatus(0, 2, 'diff');
            testCellIsEmpty(0, 3);
            cy.get('[data-test="merge-button"]')
                .invoke('attr', 'disabled')
                .should('equal', 'disabled');

            cy.get('@duplicateTableRows')
                .eq(0)
                .find('td')
                .eq(2)
                .find('div')
                .click();

            cy.get('[data-test="fill-value-a-button"]').click();

            testCellStatus(0, 1, 'selected');
            testCellStatus(0, 2, 'dropped');
            testCellContains(0, 3, 'Lauzon');
            cy.get('[data-test="merge-button"]')
                .invoke('attr', 'disabled')
                .should('equal', undefined);
        });
    });
});
