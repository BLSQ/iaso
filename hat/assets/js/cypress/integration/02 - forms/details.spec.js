/// <reference types="cypress" />

import superUser from '../../fixtures/profiles/me/superuser.json';
import orgUnitTypes from '../../fixtures/orgunittypes/dummy-list.json';
import projects from '../../fixtures/projects/list.json';
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
const formVersionsPageOne = makePaginatedResponse({
    pages: 1,
    count: 3,
    limit: 20,
    dataKey: 'form_versions',
    data: formVersions,
});

describe.only('Forms details', () => {
    before(() => {
        cy.login();
    });
    beforeEach(() => {
        cy.intercept('GET', '/sockjs-node/**');
        cy.intercept('GET', '/api/profiles/me/**', superUser);
        cy.intercept('GET', '/api/orgunittypes/**', {
            orgUnitTypes,
        });
        cy.intercept('GET', '/api/projects/**', projects);
        // TODO paramatrise form_id
        cy.intercept(
            'GET',
            'api/formversions/?&limit=20&order=-version_id&form_id=1',
            formVersionsPageOne,
        );
        cy.visit(baseUrl);
    });
    describe.skip('Filters', () => {});
    describe('Form versions', () => {
        it('Displays title', () => {});
        describe('FormVersions table', () => {});
    });
});
