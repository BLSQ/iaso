/// <reference types="cypress" />

import superUser from '../../fixtures/profiles/me/superuser.json';
import details from '../../fixtures/workflows/details.json';

const siteBaseUrl = Cypress.env('siteBaseUrl');
const baseUrl = `${siteBaseUrl}/dashboard/workflows/details/entityTypeId/3/versionId/12`;

let interceptFlag = false;
const mockPage = () => {
    cy.login();
    cy.intercept('GET', '/sockjs-node/**');
    cy.intercept('GET', '/api/profiles/me/**', {
        fixture: 'profiles/me/superuser.json',
    });
    cy.intercept('GET', '/api/workflowversions/12/', {
        fixture: 'workflows/details.json',
    });
    cy.intercept('GET', '/api/forms/7/?fields=possible_fields', {
        fixture: 'workflows/possible_fields.json',
    });
    cy.intercept('GET', '/api/formversions/?form_id=7&fields=descriptor', {
        fixture: 'workflows/descriptor.json',
    });
};
const name = 'mario';

describe('Workflows details', () => {
    it.skip('page should not be accessible if user does not have permission', () => {
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
    describe('with any status', () => {
        beforeEach(() => {
            mockPage();
            cy.visit(baseUrl);
        });
        it('should display correct infos values', () => {
            cy.get('[data-test="workflow-base-info"]')
                .as('tableInfos')
                .should('be.visible');
            cy.get('@tableInfos')
                .find('tr')
                .eq(0)
                .find('td')
                .eq(1)
                .should('contain', details.entity_type.name);
            cy.get('@tableInfos')
                .find('tr')
                .eq(1)
                .find('td')
                .eq(1)
                .should('contain', details.reference_form.name);
            cy.get('@tableInfos')
                .find('tr')
                .eq(2)
                .find('td')
                .eq(1)
                .should('contain', details.version_id);
            cy.get('@tableInfos')
                .find('tr')
                .eq(3)
                .find('td')
                .eq(1)
                .should('contain', 'Draft');
        });
        it('should be possible to edit and save name', () => {
            cy.get('[data-test="save-name-button"]').as('saveButton');
            cy.get('@saveButton')
                .invoke('attr', 'disabled')
                .should('equal', 'disabled');

            cy.fillTextField('#input-text-name', name);
            cy.get('@saveButton')
                .invoke('attr', 'disabled')
                .should('equal', undefined);

            interceptFlag = false;

            cy.intercept(
                {
                    method: 'PATCH',
                    pathname: '/api/workflowversions/12',
                },
                req => {
                    interceptFlag = true;
                    req.reply({
                        statusCode: 200,
                        body: {},
                    });
                },
            ).as('saveVersion');

            cy.get('@saveButton').click();
            cy.wait('@saveVersion').then(xhr => {
                cy.wrap(xhr.request.body).its('name').should('eq', name);
                cy.wrap(interceptFlag).should('eq', true);
            });
        });
        it.only('should display correct follow-ups', () => {
            cy.get('[data-test="follow-ups"]')
                .find('table')
                .as('followUpTable');

            cy.get('@followUpTable').should('be.visible');
            cy.get('@followUpTable')
                .find('tbody')
                .find('tr')
                .should('have.length', 2);
        });
        it.skip('should display correct changes', () => {});
    });
    describe('with DRAFT status', () => {
        it.skip('should be possible to publish', () => {});
        it.skip('should create a follow-up', () => {});
        it.skip('should edit a follow-up', () => {});
        it.skip('should change order of follow-ups and save it', () => {});
        it.skip('should create a change', () => {});
        it.skip('should edit a change', () => {});
        it.skip('should delete a change', () => {});
        describe('follow-up modal', () => {
            it.skip('should display correct infos', () => {});
            it.skip('should not save if form is not set', () => {});
            it.skip('should set condition to true if empty', () => {});
            it.skip('should save correctly', () => {});
        });
        describe('changes modal', () => {
            it.skip('should display correct infos ', () => {});
            it.skip('should match fields type', () => {});
            it.skip('should not save if a mapping is empty', () => {});
            it.skip('should not have mapping on the same field', () => {});
            it.skip('should not save if form is empty', () => {});
            it.skip('should save correctly', () => {});
        });
    });
    describe('with PUBLISHED status', () => {
        it.skip('should not be possible to publish', () => {});
        it.skip('should not create a follow-up', () => {});
        it.skip('should not edit a follow-up', () => {});
        it.skip('should not change order of follow-ups and save it', () => {});
        it.skip('should not create a change', () => {});
        it.skip('should not edit or delete a change', () => {});
    });
    describe('with UNPUBLISHED status', () => {
        it.skip('should not be possible to publish', () => {});
        it.skip('should not create a follow-up', () => {});
        it.skip('should not edit a follow-up', () => {});
        it.skip('should not change order of follow-ups and save it', () => {});
        it.skip('should not create a change', () => {});
        it.skip('should not edit or delete a change', () => {});
    });
});
