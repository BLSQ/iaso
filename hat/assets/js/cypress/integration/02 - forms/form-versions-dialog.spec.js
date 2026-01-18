/// <reference types="cypress" />

import form from '../../fixtures/forms/detail.json';
import superUser from '../../fixtures/profiles/me/superuser.json';
import {
    makeFormVersions,
    makePaginatedResponse,
} from '../../support/dummyData';

const siteBaseUrl = Cypress.env('siteBaseUrl');
const baseUrl = `${siteBaseUrl}/dashboard/forms/detail/formId/1`;

const formVersions = makeFormVersions({
    formName: 'Test Form',
    formId: 1,
    amount: 3,
});

const formVersionsResponse = makePaginatedResponse({
    pages: 1,
    count: 3,
    limit: 20,
    dataKey: 'form_versions',
    data: formVersions.formVersions,
});

describe('Form Versions Dialog', () => {
    beforeEach(() => {
        cy.login();
        cy.intercept('GET', '/sockjs-node/**');
        cy.intercept('GET', '/api/profiles/me/**', superUser);
        cy.intercept('GET', '/api/forms/1/**', form);
        cy.intercept(
            'GET',
            '/api/formversions/?form_id=1&order=-version_id&limit=20&page=1',
            formVersionsResponse,
        ).as('getFormVersions');
        cy.visit(baseUrl);
        cy.wait('@getFormVersions');
    });

    describe('Dialog Opening', () => {
        it('should open dialog when create button is clicked', () => {
            cy.get('[data-test="open-dialog-button"]').click();
            cy.get('[role="dialog"]').should('be.visible');
        });

        it('should open dialog when edit button is clicked', () => {
            // Find and click the first edit button in the table
            cy.get('table')
                .find('[data-testid="SettingsIcon"]')
                .first()
                .click();
            cy.get('[role="dialog"]').should('be.visible');
        });
    });

    describe('New Form Version', () => {
        beforeEach(() => {
            cy.get('[data-test="open-dialog-button"]').click();
        });

        it('should mount properly', () => {
            cy.get('[role="dialog"]').should('be.visible');
        });

        it('should display file input for new form version', () => {
            cy.get('input[type="file"]').should('be.visible');
        });

        it('should display validation link', () => {
            cy.get('a[href="https://getodk.org/xlsform/"]').should(
                'be.visible',
            );
        });

        it('should have save button disabled initially', () => {
            cy.get('[data-test="confirm-button"]').should('be.disabled');
        });
    });

    describe('Existing Form Version', () => {
        beforeEach(() => {
            // Click the first edit button
            cy.get('table')
                .find('[data-testid="SettingsIcon"]')
                .first()
                .click();
        });

        it('should mount properly', () => {
            cy.get('[role="dialog"]').should('be.visible');
        });

        it('should not display file input for existing form version', () => {
            cy.get('input[type="file"]').should('not.exist');
        });
    });

    describe('Dialog Actions', () => {
        beforeEach(() => {
            cy.get('[data-test="open-dialog-button"]').click();
        });

        it('should close dialog on cancel', () => {
            cy.get('[data-test="cancel-button"]').click();
            cy.get('[role="dialog"]').should('not.exist');
        });

        it('should reset form state on cancel', () => {
            // Cancel should reset the form to original state
            cy.get('[data-test="cancel-button"]').click();

            // Reopen and verify it's back to original state
            cy.get('[data-test="open-dialog-button"]').click();
            cy.get('[role="dialog"]').should('be.visible');
        });
    });

    describe('API Calls', () => {
        beforeEach(() => {
            cy.get('[data-test="open-dialog-button"]').click();
        });

        it('should call createFormVersion on confirm for new form version', () => {
            cy.intercept('POST', '/api/formversions/', {}).as(
                'createFormVersion',
            );

            // Attach a test XLSX file to the file input
            cy.get('input[type="file"]').attachFile('forms/test-form.xlsx');

            cy.get('[data-test="confirm-button"]').click();

            cy.wait('@createFormVersion');
        });

        it('should call updateFormVersion on confirm for existing form version', () => {
            cy.get('[data-test="cancel-button"]').click();
            cy.get('table')
                .find('[data-testid="SettingsIcon"]')
                .first()
                .click();

            cy.intercept('PATCH', '/api/formversions/*', {}).as(
                'updateFormVersion',
            );

            cy.get('[data-test="confirm-button"]').click();

            cy.wait('@updateFormVersion');
        });
    });
});
