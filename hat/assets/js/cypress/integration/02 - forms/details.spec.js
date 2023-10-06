/// <reference types="cypress" />

import superUser from '../../fixtures/profiles/me/superuser.json';
import orgUnitTypes from '../../fixtures/orgunittypes/dummy-list.json';
import projects from '../../fixtures/projects/list.json';
import form from '../../fixtures/forms/detail.json';
import {
    makeFormVersions,
    makePaginatedResponse,
} from '../../support/dummyData';
import { testTablerender } from '../../support/testTableRender';

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

describe('Forms details', () => {
    beforeEach(() => {
        cy.login();
        cy.intercept('GET', '/sockjs-node/**');
        cy.intercept('GET', '/api/profiles/me/**', superUser);
        cy.intercept('GET', '/api/v2/orgunittypes/**', orgUnitTypes);
        cy.intercept('GET', '/api/projects/**', projects);
        // TODO paramatrise form_id
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
    });
    describe.skip('Filters', () => {});
    describe('Form versions', () => {
        describe('FormVersions table', () => {
            testTablerender({
                baseUrl,
                rows: 3,
                columns: 4,
                apiKey: 'formversions',
            });
            // TODO test pagination
            // TODO test action button
            // TODO test modal
        });
    });
});
