/// <reference types="cypress" />
import { testTablerender } from '../../support/testTableRender';
import { testPagination } from '../../support/testPagination';
import page2 from '../../fixtures/entities/list-page-2.json';
import listFixture from '../../fixtures/entities/list.json';
import superUser from '../../fixtures/profiles/me/superuser.json';
import { testSearchField } from '../../support/testSearchField';
import { search, searchWithForbiddenChars } from '../../constants/search';

const siteBaseUrl = Cypress.env('siteBaseUrl');
const baseUrl = `${siteBaseUrl}/dashboard/entities/list`;

let interceptFlag = false;
const defaultQuery = {
    limit: '20',
    order_columns: 'last_saved_instance',
    page: '1',
};
const mockPage = (fakeUser = superUser, fixture = 'entities/list.json') => {
    cy.login();
    interceptFlag = false;
    cy.intercept('GET', '/sockjs-node/**');
    cy.intercept('GET', '/api/profiles/me/**', fakeUser);
    cy.intercept('GET', '/api/entitytypes', {
        fixture: 'entityTypes/list.json',
    }).as('getEntitiesTypes');
    cy.intercept('GET', '/api/microplanning/teams/*', {
        fixture: 'teams/list.json',
    });
    cy.intercept('GET', '/api/profiles', {
        fixture: 'profiles/list-not-paginated.json',
    });
    const options = {
        method: 'GET',
        pathname: '/api/entities/**',
        times: 100,
    };

    cy.intercept({ ...options }, req => {
        req.continue(res => {
            interceptFlag = true;
            res.send({ fixture });
        });
    }).as('getEntities');
};

describe('Entities', () => {
    describe('Page', () => {
        it('click on a row button should open entity detail page', () => {
            mockPage();
            cy.visit(baseUrl);

            cy.wait('@getEntities').then(() => {
                cy.get('table tbody tr')
                    .should('exist')
                    .eq(1)
                    .find('td')
                    .last()
                    .as('actionCell');
                cy.get('@actionCell')
                    .find('a')
                    .should(
                        'have.attr',
                        'href',
                        '/dashboard/entities/details/entityId/2',
                    );
            });
        });
    });
});
