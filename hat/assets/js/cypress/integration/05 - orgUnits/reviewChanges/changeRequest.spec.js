/// <reference types="cypress" />
const siteBaseUrl = Cypress.env('siteBaseUrl');

const baseUrl = `${siteBaseUrl}/dashboard/orgunits/changeRequest`;

const goToPage = () => {
    cy.login();
    cy.intercept('GET', '/api/profiles/me/**', {
        fixture: 'profiles/me/superuser.json',
    });
    cy.intercept('GET', '/api/groups/**', {
        fixture: 'groups/list.json',
    });
    cy.intercept('GET', '/api/orgunittypes/**', {
        fixture: 'orgunits/orgUnitChanges.json',
    });

    cy.intercept('GET', '/sockjs-node/**');
    cy.visit(baseUrl);
};

describe('OrgUnits changeRequest', () => {
    beforeEach(() => {
        goToPage();
    });

    describe('table', () => {
        it('should render changes request results', () => {
            // cy.intercept('GET', `/api/orgunits/changes/${orgUnit.id}`, {
            cy.intercept(
                'GET',
                `/api/orgunits/changes/?order=-updated_at&limit=10`,
                {
                    fixture: 'orgunits/orgUnitChanges.json',
                },
            ).as('getOrgunitsChangeRequest');
            cy.visit(baseUrl);
        });
    });
});
