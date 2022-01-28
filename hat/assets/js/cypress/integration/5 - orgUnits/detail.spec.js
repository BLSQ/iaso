/// <reference types="cypress" />

import superUser from '../../fixtures/profiles/me/superuser.json';
import orgUnit from '../../fixtures/orgunits/details.json';

const siteBaseUrl = Cypress.env('siteBaseUrl');

const baseUrl = `${siteBaseUrl}/dashboard/orgunits/detail/orgUnitId/${orgUnit.id}`;

const interceptList = [
    'profiles',
    'algorithms',
    'algorithmsruns',
    'groups',
    'orgunittypes',
];

describe('OrgUnits detail', () => {
    beforeEach(() => {
        cy.login();
        cy.intercept('GET', '/api/profiles/**', {
            fixture: 'profiles/list.json',
        });
        cy.intercept('GET', '/api/profiles/me/**', {
            fixture: 'profiles/me/superuser.json',
        });
        interceptList.forEach(i => {
            cy.intercept('GET', `/api/${i}/`, {
                fixture: `${i}/list.json`,
            });
        });
        cy.intercept('GET', `/api/datasources/?linkedTo=${orgUnit.id}`, {
            fixture: `datasources/details-ou.json`,
        });
        cy.intercept('GET', `/api/orgunits/${orgUnit.id}`, {
            fixture: 'orgunits/details.json',
        }).as('getOuDetail');
        cy.intercept(
            'GET',
            `/api/orgunits/?&orgUnitParentId=${orgUnit.id}&orgUnitTypeId=7&withShapes=true&valid`,
            {
                fixture: 'orgunits/details-children.json',
            },
        );
        cy.intercept(
            'GET',
            `/api/orgunits/?&parent_id=${orgUnit.id}&limit=10&order=name&validation_status=all`,
            {
                fixture: 'orgunits/details-children-paginated.json',
            },
        );
        cy.intercept('GET', `/api/links/?orgUnitId=${orgUnit.id}`, {
            links: [],
        });
        cy.intercept(
            'GET',
            `/api/links/?&orgUnitId=${orgUnit.id}&limit=10&order=similarity_score`,
            {
                count: 0,
                links: [],
                has_next: false,
                has_previous: false,
                page: 1,
                pages: 1,
                limit: 10,
            },
        );
        cy.intercept(
            'GET',
            `/api/instances/?order=id&orgUnitId=${orgUnit.id}`,
            {
                instances: [],
            },
        );
        cy.intercept('GET', '/sockjs-node/**');
    });
    it('page should not be accessible if user does not have permission', () => {
        const fakeUser = {
            ...superUser,
            permissions: [],
            is_superuser: false,
        };
        cy.intercept('GET', '/api/profiles/me/**', fakeUser);
        cy.visit(baseUrl);
        const errorCode = cy.get('#error-code');
        errorCode.should('contain', '401');
    });
    describe('infos tab', () => {
        it('should render correct infos', () => {
            cy.visit(baseUrl);
            cy.wait('@getOuDetail').then(() => {
                cy.testInputValue('#input-text-name', orgUnit.name);
                cy.testInputValue(
                    '#org_unit_type_id',
                    orgUnit.org_unit_type.name,
                );
            });
        });
    });
});
