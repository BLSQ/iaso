/// <reference types="cypress" />

import form from '../../fixtures/forms/detail.json';
import orgUnitTypes from '../../fixtures/orgunittypes/dummy-list.json';
import superUser from '../../fixtures/profiles/me/superuser.json';
import projects from '../../fixtures/projects/list.json';
import {
    makeFormVersions,
    makePaginatedResponse,
} from '../../support/dummyData';
import { testPermission } from '../../support/testPermission';
import { testTablerender } from '../../support/testTableRender';
import { testTopBar } from '../../support/testTopBar';
import { mockSaveCall } from '../../support/utils';

const siteBaseUrl = Cypress.env('siteBaseUrl');

const baseUrl = `${siteBaseUrl}/dashboard/forms/detail/formId/1`;
const formVersions = makeFormVersions({
    formName: 'Test Form',
    formId: 1,
    amount: 3,
});
const formVersionsPageOne = makePaginatedResponse({
    pages: 1,
    count: 3,
    limit: 20,
    dataKey: 'form_versions',
    data: formVersions.formVersions,
});

let interceptFlag = false;

const updateInterceptFlag = value => {
    interceptFlag = value;
};

describe('Forms details', () => {
    beforeEach(() => {
        cy.login();
        cy.intercept('GET', '/sockjs-node/**');
        cy.intercept('GET', '/api/profiles/me/**', superUser);
        cy.intercept('GET', '/api/v2/orgunittypes/**', orgUnitTypes).as(
            'orgUnitTypes',
        );
        // FIXME: this call returns 500
        cy.intercept({ method: 'GET', url: '/api/projects/**' }, projects).as(
            'projects',
        );
        // TODO parametrise form_id
        cy.intercept(
            'GET',
            '/api/formversions/?form_id=1&order=-version_id&limit=20&page=1',
            formVersionsPageOne,
        ).as('getFormVersions');
        cy.intercept(
            'GET',
            // eslint-disable-next-line max-len
            '/api/forms/1/?fields=id,name,org_unit_types,projects,period_type,derived,single_per_period,periods_before_allowed,periods_after_allowed,device_field,location_field,label_keys,possible_fields,legend_threshold,change_request_mode',
            form,
        ).as('getForm');
        cy.visit(baseUrl);
        cy.wait('@projects');
    });
    describe('Filters', () => {
        it('renders only base filters by default', () => {
            cy.getAndAssert('#input-text-name');
            cy.getAndAssert('#period_type');
            cy.getAndAssert('#project_ids');
            cy.getAndAssert('#org_unit_type_ids');
            cy.get('#input-text-device_field').should('not.exist');
            cy.get('#input-text-location_field').should('not.exist');
            cy.get('#label_keys').should('not.exist');
            cy.get('#change_request_mode').should('not.exist');
            cy.get('#input-text-periods_before_allowed').should('not.exist');
            cy.get('#input-text-periods_after_allowed').should('not.exist');
            cy.get('[data-test="single_per_period"]').should('not.exist');
        });
    });
    describe('When mounting', () => {
        testPermission(baseUrl);
        testTopBar(baseUrl, 'Form', true);
    });
    describe('When updating', () => {
        it('Save button is disabled if no project', () => {
            cy.wait(['@getForm', '@getFormVersions']);
            cy.get('#project_ids').as('projectsInput').click();
            cy.get('[data-id="form-detail-confirm"]')
                .invoke('attr', 'disabled')
                .should('eq', 'disabled');
        });
        it('Save button is disabled if no name', () => {
            cy.wait(['@getForm', '@getFormVersions']);
            // Wait for React's useEffect to finish populating the form state
            cy.get('#input-text-name')
                .as('nameInput')
                .should('have.value', 'FORM 1');
            // Now clear it
            cy.get('@nameInput').clear();
            cy.get('[data-id="form-detail-confirm"]')
                .invoke('attr', 'disabled')
                .should('eq', 'disabled');
        });
        it('Save button is disabled if period type but no single per period', () => {
            cy.wait(['@getForm', '@getFormVersions']);
            // Wait for React's useEffect to finish populating the form state
            cy.get('#input-text-name').should('have.value', 'FORM 1');
            cy.fillSingleSelect('#period_type', 2);
            cy.get('[data-id="form-detail-confirm"]')
                .invoke('attr', 'disabled')
                .should('eq', 'disabled');
        });
        it('Saves new data', () => {
            const newName = 'Yabadabadoo';
            const periodBefore = 4;
            const periodAfter = 4;
            const updatedData = {
                name: newName,
                period_type: 'MONTH',
                single_per_period: true,
                periods_before_allowed: periodBefore,
                periods_after_allowed: periodAfter,
                project_ids: [3],
                // skipping org unit types as it's difficult to reliably target one from the dummy data
                // org_unit_type_ids: [1],
            };
            cy.wait(['@getForm', '@getFormVersions']);
            // Wait for React's useEffect to finish populating the form state
            cy.get('#input-text-name').should('have.value', 'FORM 1');

            cy.fillTextField('#input-text-name', newName);

            cy.fillSingleSelect('#period_type', 2);

            cy.getAndAssert('#input-text-periods_before_allowed').as(
                'periodsBefore',
            );
            cy.fillTextField('@periodsBefore', periodBefore);
            cy.getAndAssert('#input-text-periods_after_allowed').as(
                'periodsAfter',
            );
            cy.fillTextField('@periodsAfter', periodAfter);
            cy.getAndAssert('[data-test="single_per_period"]')
                .as('singlePerPeriod')
                .within(() => {
                    cy.get('input').first().click();
                });

            cy.fillMultiSelect('#project_ids', [2], false);
            cy.get('[data-id="form-detail-confirm"]')
                .as('saveButton')
                .invoke('attr', 'disabled')
                .should('eq', undefined);

            mockSaveCall({
                method: 'PUT',
                pathname: `/api/forms/${form.id}`,
                updateInterceptFlag,
                requestBody: updatedData,
                responseBody: updatedData,
                strict: false,
            });
            cy.get('@saveButton').click();
            cy.wait('@save').then(() => {
                cy.wrap(interceptFlag).should('eq', true);
            });
            // TODO test advanced settings
        });
    });

    describe('Form versions', () => {
        describe('FormVersions table', () => {
            testTablerender({
                baseUrl,
                rows: 3,
                columns: 8,
                apiKey: 'formversions',
            });
            it('has "Create" button', () => {
                cy.getAndAssert('[data-test="open-dialog-button"]');
            });
            // TODO test pagination
            // TODO test action button
            // TODO test modal
        });
    });
});

describe('mounts when empty', () => {
    beforeEach(() => {
        cy.login();
        cy.intercept('GET', '/sockjs-node/**');
        cy.intercept('GET', '/api/profiles/me/**', superUser);
        cy.intercept('GET', '/api/v2/orgunittypes/**', []).as('emptyTypes');
        cy.intercept('GET', '/api/projects/**', []).as('emptyProjects');
        // TODO parametrise form_id
        cy.intercept(
            'GET',
            '/api/formversions/?&limit=20&order=-version_id&form_id=1',
            formVersionsPageOne,
        );
        cy.intercept(
            'GET',
            // eslint-disable-next-line max-len
            '/api/forms/1/?fields=id,name,org_unit_types,projects,period_type,derived,single_per_period,periods_before_allowed,periods_after_allowed,device_field,location_field,label_keys,possible_fields',
            form,
        );
        cy.visit(baseUrl);
        cy.wait('@emptyProjects');
    });
    it('project and org unit types', () => {
        cy.getAndAssert('#input-text-name');
        cy.getAndAssert('#period_type');
        cy.getAndAssert('#project_ids');
        cy.getAndAssert('#org_unit_type_ids');
        cy.get('input-text-device_field').should('not.exist');
        cy.get('input-text-location_field').should('not.exist');
        cy.get('label_keys').should('not.exist');
        cy.get('change_request_mode').should('not.exist');
        cy.get('input-text-periods_before_allowed').should('not.exist');
        cy.get('input-text-periods_after_allowed').should('not.exist');
        cy.get('[data-test="single-per-period"]').should('not.exist');
    });
});

describe('Does not crash on API errors', () => {
    beforeEach(() => {
        cy.login();
        cy.intercept('GET', '/sockjs-node/**');
        cy.intercept('GET', '/api/profiles/me/**', superUser);
        cy.intercept('GET', '/api/v2/orgunittypes/**', orgUnitTypes).as(
            'orgUnitTypes',
        );
        // TODO parametrise form_id
        cy.intercept(
            'GET',
            '/api/formversions/?&limit=20&order=-version_id&form_id=1',
            formVersionsPageOne,
        );
        cy.intercept(
            'GET',
            // eslint-disable-next-line max-len
            '/api/forms/1/?fields=id,name,org_unit_types,projects,period_type,derived,single_per_period,periods_before_allowed,periods_after_allowed,device_field,location_field,label_keys,possible_fields',
            form,
        );
    });
    describe('from projets API', () => {
        it('400', () => {
            cy.intercept('GET', '/api/projects/**', {
                statusCode: 400,
                body: 'Error 400',
            }).as('projects');
            cy.visit(baseUrl);
            cy.wait('@projects');
            cy.getAndAssert('#input-text-name');
            cy.getAndAssert('#period_type');
            cy.getAndAssert('#project_ids');
            cy.getAndAssert('#org_unit_type_ids');
        });
        it('500', () => {
            cy.intercept('GET', '/api/projects/**', {
                statusCode: 500,
                body: 'Error 400',
            }).as('projects');
            cy.visit(baseUrl);
            cy.wait('@projects');
            cy.getAndAssert('#input-text-name');
            cy.getAndAssert('#period_type');
            cy.getAndAssert('#project_ids');
            cy.getAndAssert('#org_unit_type_ids');
        });
    });
});
