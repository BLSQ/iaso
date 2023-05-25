/// <reference types='cypress' />

import superUser from '../../fixtures/profiles/me/superuser.json';
import submission from '../../fixtures/submissions/details_1007.json';
import submissionLogs from '../../fixtures/submissions/submission_logs.json';
import { testPermission } from '../../support/testPermission';
// import { testTopBar } from '../../support/testTopBar';

const siteBaseUrl = Cypress.env('siteBaseUrl');

const baseUrl = `${siteBaseUrl}/dashboard/forms/submission/instanceId/1007`;

const topBarTitle = `${submission.form_name}: ${submission.file_name.replace(
    '.xml',
    '',
)}`;

describe('Instance details', () => {
    beforeEach(() => {
        cy.login();
        cy.intercept('GET', '/api/instances/1007', submission).as(
            'getSubmission',
        );
        cy.intercept('GET', '/api/profiles/me/**', superUser);
        cy.intercept(
            'GET',
            '/api/logs/?objectId=1007&order=-created_at&contentType=iaso.form',
            submissionLogs,
        ).as('getLogs');
    });
    console.log(baseUrl);
    testPermission(baseUrl);
    describe.skip('Top Bar', () => {
        it('Displays TopBar with title and menu', () => {
            cy.visit(baseUrl);
            cy.wait('@getSubmission');
            cy.get('#top-bar-back-button').should('exist');
            cy.get('#top-bar-title', { timeout: 1000 }).should(
                'contain',
                topBarTitle,
            );
        });
    });
    // testTopBar(baseUrl, topBarTitle, true);
    describe('Component layout', () => {
        it('positions grid components correctly', async () => {
            cy.visit(baseUrl);
            cy.getAndAssert('#infos', 'infos');
            cy.getAndAssert('#location', 'location');
            cy.getAndAssert('#export-requests', 'export-requests');
            cy.getAndAssert('#files', 'files');
            cy.getAndAssert('#form-contents', 'form-contents');
            cy.isAbove('@infos', '@location');
            cy.isAbove('@location', '@export-requests');
            cy.isAbove('@export-requests', '@files');
            cy.isLeftOf('@infos', '@form-contents');
            cy.isLeftOf('@location', '@form-contents');
            cy.isLeftOf('@export-requests', '@form-contents');
            cy.isLeftOf('@files', '@form-contents');
        });
    });
});
