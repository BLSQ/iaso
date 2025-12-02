/// <reference types="cypress" />

import moment from 'moment';
import formsList from '../../fixtures/forms/list.json';
import orgUnit from '../../fixtures/orgunits/details.json';
import { testPagination } from '../../support/testPagination';
import { testPermission } from '../../support/testPermission';
import { testTablerender } from '../../support/testTableRender';

const siteBaseUrl = Cypress.env('siteBaseUrl');

const baseUrl = `${siteBaseUrl}/dashboard/orgunits/detail/orgUnitId/${orgUnit.id}/tab/forms`;

const testRowContent = (index, form = formsList.forms[index]) => {
    const formCreatedAt = moment
        .unix(form.created_at)
        .format('DD/MM/YYYY HH:mm');
    const formUpdatedAt = moment
        .unix(form.updated_at)
        .format('DD/MM/YYYY HH:mm');

    const formLastInstance = moment
        .unix(form.instance_updated_at)
        .format('DD/MM/YYYY HH:mm');

    cy.get('[data-test=forms-tab]').find('table').as('table');
    cy.get('@table').find('tbody').find('tr').eq(index).as('row');
    cy.get('@row').find('td').eq(1).should('contain', form.name);
    cy.get('@row').find('td').eq(2).should('contain', formCreatedAt);
    cy.get('@row').find('td').eq(3).should('contain', formUpdatedAt);

    cy.get('@row')
        .find('td')
        .eq(4)
        .should('contain', form.org_unit_types[0].name);
    cy.get('@row').find('td').last().find('button').should('have.length', 2);
};

const goToPage = () => {
    cy.login();
    cy.intercept('GET', '/api/profiles/**', {
        fixture: 'profiles/list.json',
    });
    cy.intercept('GET', '/api/profiles/me/**', {
        fixture: 'profiles/me/superuser.json',
    });

    cy.intercept('GET', ` /api/forms/*`, {
        fixture: `forms/list.json`,
    }).as('getForms');

    cy.intercept('GET', `/api/orgunits/${orgUnit.id}`, {
        fixture: 'orgunits/details.json',
    }).as('getOuDetail');

    cy.intercept('GET', `/api/links/?orgUnitId=${orgUnit.id}`, {
        fixture: 'links/list-linked.json',
    });

    cy.intercept('GET', `/api/instances/?order=id&orgUnitId=${orgUnit.id}`, {
        instances: [],
    });
    cy.intercept('GET', '/sockjs-node/**');

    cy.visit(baseUrl);
};

describe('forms tab', () => {
    beforeEach(() => {
        goToPage();
    });

    testPermission(baseUrl);

    describe('Table', () => {
        it('should render correct infos', () => {
            cy.wait(['@getOuDetail', '@getForms']).then(() => {
                cy.get('[data-test="forms-tab"]').find('table').as('table');
                cy.get('@table').should('have.length', 1);
                cy.get('@table').find('tbody').find('tr').as('rows');
                cy.get('@rows').should('have.length', formsList.count);
                cy.get('@rows').eq(0).as('row');
                cy.get('@row').find('td').should('have.length', 6);
                cy.get('@row').find('td').eq(1).as('nameCol');

                cy.get('@nameCol').should(
                    'contain.text',
                    formsList.forms[0].name,
                );
            });
        });

        testTablerender({
            baseUrl,
            rows: formsList.forms.length,
            columns: 6,
            apiPath: `forms/*`,
            apiKey: `forms`,
            withVisit: false,
            selector: '[data-test="forms-tab"] table',
            request: '@getOuDetail',
        });

        testPagination({
            baseUrl,
            apiPath: '/api/forms/',
            query: {
                orgUnitId: `${orgUnit.id}`,
                limit: '10',
                order: 'name',
                page: '1',
            },
            apiKey: 'forms',
            withSearch: false,
            fixture: formsList,
            selector: '[data-test="forms-tab"]',
        });

        it('should render correct row infos', () => {
            cy.wait('@getOuDetail').then(() => {
                testRowContent(0);
            });
        });
    });

    describe('Actions buttons', () => {
        it('should contain a link with the right href', () => {
            const submissionsHref = `/dashboard/forms/submissions/formIds/1/levels/${orgUnit.id}/tab/list`;

            cy.wait('@getOuDetail').then(() => {
                cy.get('table').as('table');
                cy.get('@table').find('tbody').find('tr').eq(0).as('row');

                cy.get('@row')
                    .find('td')
                    .last()
                    .find('button')
                    .eq(0)
                    .find('a')
                    .should('have.attr', 'href', submissionsHref);
            });
        });
    });
});
