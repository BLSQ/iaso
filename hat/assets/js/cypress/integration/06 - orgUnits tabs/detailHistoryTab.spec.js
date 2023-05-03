/// <reference types="cypress" />

import moment from 'moment';
import linkedLogsPaginated from '../../fixtures/logs/list-linked-paginated.json';
import logsDetails from '../../fixtures/logs/logs-details.json';
import page2 from '../../fixtures/logs/list-linked-paginated2.json';
import orgUnit from '../../fixtures/orgunits/details.json';
import { testPagination } from '../../support/testPagination';
import { testPermission } from '../../support/testPermission';
import { testTablerender } from '../../support/testTableRender';

const siteBaseUrl = Cypress.env('siteBaseUrl');

const baseUrl = `${siteBaseUrl}/dashboard/orgunits/detail/orgUnitId/${orgUnit.id}/tab/history`;

const interceptList = [
    'profiles',
    'algorithms',
    'algorithmsruns',
    'orgunittypes',
];

let interceptFlag = false;

const testRowContent = (
    index,
    linkedLogs = linkedLogsPaginated.list[index],
) => {
    const linkedLogscreatedAt = moment(linkedLogs.created_at).format(
        'DD/MM/YYYY HH:mm',
    );

    cy.get('[data-test=logs-tab]').find('table').as('table');
    cy.get('@table').find('tbody').find('tr').eq(index).as('row');
    cy.get('@row').find('td').eq(0).should('contain', linkedLogs.id);
    cy.get('@row').find('td').eq(1).should('contain', linkedLogscreatedAt);
    cy.get('@row')
        .find('td')
        .eq(2)
        .should('contain', linkedLogs.user.user_name);

    cy.get('@row').find('td').last().find('button').should('have.length', 1);
};

const goToPage = () => {
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
    cy.intercept('GET', `/api/groups/?&dataSource=${orgUnit.source_id}`, {
        fixture: `groups/list.json`,
    });
    cy.intercept(
        'GET',
        ` /api/forms/?&orgUnitId=${orgUnit.id}&limit=10&order=name`,
        {
            fixture: `forms/list.json`,
        },
    );

    cy.intercept(
        'GET',
        `/api/logs/?&objectId=${orgUnit.id}&contentType=iaso.orgunit&limit=10&order=-created_at`,
        {
            fixture: `logs/list-linked-paginated.json`,
        },
    );
    cy.intercept('GET', `/api/datasources/?linkedTo=${orgUnit.id}`, {
        fixture: `datasources/details-ou.json`,
    });
    cy.intercept(
        'GET',
        `/api/orgunits/?linkedTo=${orgUnit.id}&linkValidated=all&linkSource=69&validation_status=all&withShapes=true`,
        {
            body: { orgUnits: [] },
        },
    ).as('linkedOrgUnits');
    cy.intercept(
        'GET',
        `/api/comments/?object_pk=${orgUnit.id}&content_type=iaso-orgunit&limit=4`,
        {
            fixture: `comments/list.json`,
        },
    );
    cy.intercept('GET', `/api/orgunits/${orgUnit.id}`, {
        fixture: 'orgunits/details.json',
    }).as('getOuDetail');
    cy.intercept(
        'GET',
        `/api/orgunits/?&parent_id=${orgUnit.id}&limit=10&order=name&validation_status=all`,
        {
            fixture: 'orgunits/details-children-paginated.json',
        },
    );
    cy.intercept('GET', `/api/links/?orgUnitId=${orgUnit.id}`, {
        fixture: 'links/list-linked.json',
    });
    cy.intercept(
        'GET',
        `/api/links/?&orgUnitId=${orgUnit.id}&limit=10&order=similarity_score`,
        {
            fixture: 'links/list-linked-paginated.json',
        },
    );
    cy.intercept('GET', `/api/instances/?order=id&orgUnitId=${orgUnit.id}`, {
        instances: [],
    });

    cy.intercept(
        'GET',
        `logs/?&objectId=1&contentType=iaso.orgunit&limit=10&page=2&order=-created_at`,
        page2,
    );
    cy.intercept('GET', '/sockjs-node/**');
    cy.intercept(
        'GET',
        `/api/orgunits/?&orgUnitParentId=${orgUnit.id}&orgUnitTypeId=${orgUnit.org_unit_type.sub_unit_types[0].id}&withShapes=true&validation_status=all`,
        {
            orgUnits: [
                {
                    id: 11,
                    name: 'Org Unit Type 2',
                    short_name: 'Org Unit Type 2',
                },
            ],
        },
    );
    cy.visit(baseUrl);
};

describe('history tab', () => {
    beforeEach(() => {
        goToPage();
    });

    testPermission(baseUrl);

    describe('Table', () => {
        it('should render correct infos', () => {
            cy.wait('@getOuDetail').then(() => {
                cy.get('[data-test="logs-tab"]').find('table').as('table');
                cy.get('@table').should('have.length', 1);
                cy.get('@table').find('tbody').find('tr').as('rows');
                cy.get('@rows').should(
                    'have.length',
                    linkedLogsPaginated.count,
                );
                cy.get('@rows').eq(0).as('row');
                cy.get('@row').find('td').should('have.length', 4);
                cy.get('@row').find('td').eq(2).as('userNameCol');

                cy.get('@userNameCol').should(
                    'contain.text',
                    linkedLogsPaginated.list[0].user.user_name,
                );
            });
        });

        testTablerender({
            baseUrl,
            rows: linkedLogsPaginated.list.length,
            columns: 4,
            apiPath:
                'logs/?&objectId=2&contentType=iaso.orgunit&limit=10&order=-created_at',
            apiKey: 'logs',
            withVisit: false,
            selector: '[data-test="logs-tab"] table',
            request: '@getOuDetail',
        });

        it('should render correct row infos', () => {
            cy.wait('@getOuDetail').then(() => {
                testRowContent(0);
            });
        });

        testPagination({
            baseUrl,
            apiPath: `/api/logs/**`,
            query: {
                objectId: '2',
                contentType: 'iaso.orgunit',
                limit: '10',
                order: '-created_at',
            },
            apiKey: 'list',
            withSearch: false,
            fixture: linkedLogsPaginated,
            selector: '[data-test="logs-tab"]',
        });
    });

    describe('Actions buttons', () => {
        it('should make call api with correct params', () => {
            cy.wait('@getOuDetail').then(() => {
                interceptFlag = false;

                cy.intercept(
                    {
                        method: 'GET',
                        pathname: `/api/logs/${linkedLogsPaginated.list[0].id}/`,
                    },
                    req => {
                        interceptFlag = true;
                        req.reply({
                            statusCode: 200,
                            body: logsDetails,
                        });
                    },
                ).as('getLogDetails');

                cy.get('[data-test="logs-tab"]').find('table').as('table');
                cy.get('@table').find('tbody').find('tr').eq(0).as('row');
                cy.get('@row').find('td').last().find('button').click();

                cy.wait('@getLogDetails').then(() => {
                    cy.wrap(interceptFlag).should('eq', true);
                });
            });
        });
    });

    // TO DO
    // - test past value and next value are the good ones in LogCompareComponent
    // - test actions in LogCompareComponent
    describe.skip('Changes', () => {});
});
