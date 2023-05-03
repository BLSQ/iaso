/// <reference types="cypress" />

import moment from 'moment';
import linkedListPaginated from '../../fixtures/links/list-linked-paginated.json';
import page2 from '../../fixtures/links/list-page2.json';
import orgUnit from '../../fixtures/orgunits/details.json';
import { testPageFilters } from '../../support/testPageFilters';
import { testPagination } from '../../support/testPagination';
import { testPermission } from '../../support/testPermission';
import { testTablerender } from '../../support/testTableRender';
import { testDownloadButtons } from '../../support/testDownloadButtons';

const siteBaseUrl = Cypress.env('siteBaseUrl');

const baseUrl = `${siteBaseUrl}/dashboard/orgunits/detail/orgUnitId/${orgUnit.id}/tab/links`;

const interceptList = [
    // 'profiles',
    'algorithms',
    // 'algorithmsruns',
    // 'groups',
    'orgunittypes',
];

const defaultQuery = {
    orgUnitId: '2',
    limit: '10',
    order: 'similarity_score',
    page: '1',
};

const newFilters = {
    linksParamsSearch: {
        value: 'ZELDA',
        urlValue: 'ZELDA',
        selector: '#search-linksParamsSearch',
        type: 'text',
    },
    linksParamsAlgorithmRunId: {
        value: [0],
        urlValue: '4',
        selector: '#linksParamsAlgorithmRunId',
        type: 'multi',
    },
    linksParamsScore: {
        value: [0],
        urlValue: '0,20',
        selector: '#linksParamsScore',
        type: 'multi',
    },
    linksParamsValidatorId: {
        value: [0],
        urlValue: '2',
        selector: '#linksParamsValidatorId',
        type: 'multi',
    },
    linksParamsAlgorithmId: {
        value: [0],
        urlValue: '1',
        selector: '#linksParamsAlgorithmId',
        type: 'multi',
    },
    linksParamsValidation_status: {
        value: [0],
        urlValue: 'all',
        selector: '#linksParamsValidation_status',
        type: 'multi',
    },
    linksParamsOrigin: {
        value: [0],
        urlValue: '33',
        selector: '#linksParamsOrigin',
        type: 'multi',
    },
};

let interceptFlag = false;

const testRowContent = (
    index,
    orgunitDetailLinks = linkedListPaginated.links[index],
) => {
    const orgunitDetailLinksUpdatedAt = moment
        .unix(orgunitDetailLinks.updated_at)
        .format('DD/MM/YYYY HH:mm');

    cy.get('[data-test=links-tab]').find('table').as('table');
    cy.get('@table').find('tbody').find('tr').eq(index).as('row');
    cy.get('@row')
        .find('td')
        .eq(0)
        .should('contain', orgunitDetailLinks.similarity_score);
    cy.get('@row')
        .find('td')
        .eq(1)
        .should('contain', orgunitDetailLinks.source.name);
    cy.get('@row')
        .find('td')
        .eq(2)
        .should('contain', orgunitDetailLinks.source.source);
    cy.get('@row')
        .find('td')
        .eq(3)
        .should('contain', orgunitDetailLinks.destination.source);
    cy.get('@row')
        .find('td')
        .eq(4)
        .should('contain', orgunitDetailLinksUpdatedAt);
    cy.get('@row')
        .find('td')
        .eq(5)
        .should(
            'contain',
            orgunitDetailLinks.algorithm_run.algorithm.description,
        );
    cy.get('@row')
        .find('td')
        .eq(6)
        .as('orgunitDetailLinksValidator')
        .should('be.empty');
    cy.get('@row')
        .find('td')
        .eq(7)
        .get('[type="checkbox"')
        .as('orgunitDetailLinksValidated')
        .should('not.have.attr', 'checked', '');

    cy.get('@row')
        .find('td')
        .last()
        .find('button')
        .as('actionButton')
        .should('have.length', 1);
};

const goToPage = () => {
    cy.login();
    cy.intercept('GET', '/api/profiles/**', {
        fixture: 'profiles/list.json',
    }).as('allProfiles');
    cy.intercept('GET', '/api/profiles/me/**', {
        fixture: 'profiles/me/superuser.json',
    }).as('me');
    interceptList.forEach(i => {
        cy.intercept('GET', `/api/${i}/`, {
            fixture: `${i}/list.json`,
        }).as(`${i}List`);
    });
    cy.intercept('GET', '/api/groups/', {
        fixture: `groups/list.json`,
    }).as('groupList');
    cy.intercept(
        'GET',
        `/api/forms/?&orgUnitId=${orgUnit.id}&limit=10&order=name`,
        {
            fixture: `forms/list.json`,
        },
    ).as('formsList');

    cy.intercept('GET', '/api/algorithmsruns/', {
        fixture: 'algorithmsruns/list.json',
    }).as('algorithmsRuns');

    cy.intercept(
        'GET',
        `/api/logs/?&objectId=${orgUnit.id}&contentType=iaso.orgunit&limit=10&order=-created_at`,
        {
            fixture: `logs/list-linked-paginated.json`,
        },
    ).as('logs');
    cy.intercept('GET', `/api/datasources/?linkedTo=${orgUnit.id}`, {
        fixture: `datasources/details-ou.json`,
    }).as('datasources');
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
    ).as('comments');
    cy.intercept('GET', `/api/orgunits/${orgUnit.id}`, {
        fixture: 'orgunits/details.json',
    }).as('getOuDetail');
    cy.intercept(
        'GET',
        `/api/orgunits/?&parent_id=${orgUnit.id}&limit=10&order=name&validation_status=all`,
        {
            fixture: 'orgunits/details-children-paginated.json',
        },
    ).as('childrenPaginated');
    cy.intercept('GET', `/api/links/?orgUnitId=${orgUnit.id}`, {
        fixture: 'links/list-linked.json',
    }).as('links');
    cy.intercept(
        'GET',
        `/api/links/?&orgUnitId=${orgUnit.id}&limit=10&order=similarity_score`,
        {
            fixture: 'links/list-linked-paginated.json',
        },
    ).as('similarityScore');
    cy.intercept('GET', `/api/instances/?order=id&orgUnitId=${orgUnit.id}`, {
        instances: [],
    }).as('instances');
    cy.intercept('GET', '/sockjs-node/**').as('socks');
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
    ).as('ouType2');
    cy.intercept(
        'GET',
        `orgunits/?&parent_id=${orgUnit.id}&limit=10&page=2&order=name&validation_status=all`,
        page2,
    ).as('page2');
    cy.visit(baseUrl);
    // cy.wait('@socks', { timeout: 10000 });
    cy.wait('@me');
    cy.wait('@algorithmsRuns');
    // cy.wait('@getOuDetail');// duplicate in tablePagination test
    // cy.wait('@allProfiles');
    cy.wait('@groupList');
    // cy.wait('@formsList');
    // cy.wait('@logs');
    cy.wait('@datasources');
    // cy.wait('@linkedOrgUnits');
    // cy.wait('@comments');
    cy.wait('@childrenPaginated');
    cy.wait('@links');
    cy.wait('@similarityScore');
    cy.wait('@instances');
    cy.wait('@ouType2');
    // cy.wait('@page2');
    interceptList.forEach(i => {
        cy.wait(`@${i}List`);
    });
};

describe('links tab', () => {
    beforeEach(() => {
        goToPage();
    });

    testPermission(baseUrl);

    describe('Table', () => {
        before(() => {});
        it('should render correct infos', () => {
            cy.visit(baseUrl);
            cy.wait('@getOuDetail').then(() => {
                cy.get('[data-test="links-tab"]').find('table').as('table');
                cy.get('@table').should('have.length', 1);
                cy.get('@table').find('tbody').find('tr').as('rows');
                cy.get('@rows').should(
                    'have.length',
                    linkedListPaginated.count,
                );
                cy.get('@rows').eq(0).as('row');
                cy.get('@row').find('td').should('have.length', 9);
                cy.get('@row').find('td').eq(1).as('nameCol');

                cy.get('@nameCol').should(
                    'contain.text',
                    linkedListPaginated.links[0].destination.name,
                );
                cy.get('@nameCol').should(
                    'contain.text',
                    linkedListPaginated.links[0].source.name,
                );
            });
        });

        testTablerender({
            baseUrl,
            rows: linkedListPaginated.links.length,
            columns: 9,
            apiPath: `links/?&orgUnitId=${orgUnit.id}&limit=10&order=similarity_score`,
            apiKey: `links`,
            withVisit: true,
            selector: '[data-test="links-tab"] table',
            request: '@getOuDetail',
        });

        it('should render correct row infos', () => {
            cy.visit(baseUrl);
            cy.wait('@getOuDetail').then(() => {
                testRowContent(0);
            });
        });

        testPagination({
            baseUrl,
            apiPath: '/api/links/**',
            query: {
                orgUnitId: `${orgUnit.id}`,
                limit: '10',
                order: 'similarity_score',
            },
            apiKey: 'links',
            withSearch: false,
            fixture: linkedListPaginated,
            selector: '[data-test="links-tab"]',
        });
    });

    describe('Actions buttons', () => {
        it('should make call api with correct params', () => {
            cy.visit(baseUrl);
            cy.wait('@getOuDetail').then(() => {
                interceptFlag = false;

                cy.intercept(
                    {
                        method: 'GET',
                        pathname: `/api/links/${linkedListPaginated.links[0].id}/`,
                    },
                    req => {
                        interceptFlag = true;
                        req.reply({
                            statusCode: 200,
                            body: linkedListPaginated,
                        });
                    },
                ).as('getLinkId');

                cy.get('[data-test="links-tab"]').find('table').as('table');
                cy.get('@table').find('tbody').find('tr').eq(0).as('row');
                cy.get('@row').find('td').last().find('button').click();

                cy.wait('@getLinkId').then(() => {
                    cy.wrap(interceptFlag).should('eq', true);
                });
            });
        });
    });

    describe('Filters', () => {
        it('change filters should deep link and call api with correct params', () => {
            cy.visit(baseUrl);
            cy.wait('@getOuDetail').then(() => {
                interceptFlag = false;
                cy.intercept(
                    {
                        method: 'GET',
                        pathname: '/api/links/**',
                        query: {
                            ...defaultQuery,
                            search: newFilters.linksParamsSearch.urlValue,
                            algorithmRunId:
                                newFilters.linksParamsAlgorithmRunId.urlValue,
                            score: newFilters.linksParamsScore.urlValue,
                            validatorId:
                                newFilters.linksParamsValidatorId.urlValue,
                            algorithmId:
                                newFilters.linksParamsAlgorithmId.urlValue,
                            validation_status:
                                newFilters.linksParamsValidation_status
                                    .urlValue,
                            origin: newFilters.linksParamsOrigin.urlValue,
                        },
                    },
                    req => {
                        interceptFlag = true;
                        req.reply({
                            statusCode: 200,
                            body: linkedListPaginated,
                        });
                    },
                ).as('getLinksSearch');
                testPageFilters(
                    newFilters,
                    '[data-test="links-tab"] [data-test="search-button"]',
                );

                cy.wait('@getLinksSearch').then(() => {
                    cy.wrap(interceptFlag).should('eq', true);
                });
            });
        });
    });

    describe('Export csv/xlsx/gpkg buttons', () => {
        it('should download file via out own anchor click', () => {
            cy.visit(baseUrl);
            testDownloadButtons(
                '[data-test="links-tab"] [data-test="download-buttons"]',
                'links',
            );
        });
    });
});
