/// <reference types="cypress" />

import moment from 'moment';
import orgUnitsChildrenList from '../../fixtures/orgunits/details-children-paginated.json';
import orgUnit from '../../fixtures/orgunits/details.json';
import page2 from '../../fixtures/orgunits/list-page2.json';
import { testDownloadButtons } from '../../support/testDownloadButtons';
import { testPageFilters } from '../../support/testPageFilters';
import { testPagination } from '../../support/testPagination';
import { testPermission } from '../../support/testPermission';
import { testTablerender } from '../../support/testTableRender';

const siteBaseUrl = Cypress.env('siteBaseUrl');

const baseUrl = `${siteBaseUrl}/dashboard/orgunits/detail/orgUnitId/${orgUnit.id}/tab/children`;

const interceptList = [
    'profiles',
    'algorithms',
    'algorithmsruns',
    'orgunittypes',
];
const defaultQuery = {
    parent_id: '2',
    limit: '10',
    order: 'name',
    validation_status: 'all',
};
const newFilters = {
    childrenParamsSearch: {
        value: 'ZELDA',
        urlValue: 'ZELDA',
        selector: '#search-childrenParamsSearch',
        type: 'text',
    },
    childrenParamsOrgUnitTypeId: {
        value: [0],
        urlValue: '47',
        selector: '#childrenParamsOrgUnitTypeId',
        type: 'multi',
    },
    childrenParamsWithLocation: {
        value: [0],
        urlValue: 'true',
        selector: '#childrenParamsWithLocation',
        type: 'multi',
    },
    childrenParamsWithShape: {
        value: [0],
        urlValue: 'true',
        selector: '#childrenParamsWithShape',
        type: 'multi',
    },
    childrenParamsGroup: {
        value: [0],
        urlValue: '4',
        selector: '#childrenParamsGroup',
        type: 'multi',
    },
    childrenParamsHasInstances: {
        value: [0],
        urlValue: 'true',
        selector: '#childrenParamsHasInstances',
        type: 'multi',
    },
    childrenParamsValidation_status: {
        value: [1],
        urlValue: 'NEW',
        selector: '#childrenParamsValidation_status',
        type: 'multi',
    },
};

let interceptFlag = false;

const testRowContent = (
    index,
    orgunitDetailChildren = orgUnitsChildrenList.orgunits[index],
) => {
    const orgunitDetailChildrencreatedAt = moment
        .unix(orgunitDetailChildren.created_at)
        .format('DD/MM/YYYY HH:mm');
    const orgunitDetailChildrenUpdatedAt = moment
        .unix(orgunitDetailChildren.updated_at)
        .format('DD/MM/YYYY HH:mm');

    const orgunitDetailChildrenValidationStatus =
        orgunitDetailChildren.validation_status.charAt(0).toUpperCase() +
        orgunitDetailChildren.validation_status.slice(1).toLowerCase();

    cy.get('[data-test=children-tab]').find('table').as('table');
    cy.get('@table').find('tbody').find('tr').eq(index).as('row');
    cy.get('@row').find('td').eq(0).should('contain', orgunitDetailChildren.id);
    cy.get('@row')
        .find('td')
        .eq(1)
        .should('contain', orgunitDetailChildren.name);
    cy.get('@row')
        .find('td')
        .eq(2)
        .should('contain', orgunitDetailChildren.org_unit_type_name);
    cy.get('@row')
        .find('td')
        .eq(3)
        .should('contain', orgunitDetailChildren.groups[0].name);
    cy.get('@row')
        .find('td')
        .eq(4)
        .should('contain', orgunitDetailChildren.source);
    cy.get('@row')
        .find('td')
        .eq(5)
        .should('contain', orgunitDetailChildrenValidationStatus);
    cy.get('@row')
        .find('td')
        .eq(6)
        .should('contain', orgunitDetailChildren.instances_count);
    cy.get('@row')
        .find('td')
        .eq(7)
        .should('contain', orgunitDetailChildrenUpdatedAt);
    cy.get('@row')
        .find('td')
        .eq(8)
        .should('contain', orgunitDetailChildrencreatedAt);

    if (
        orgunitDetailChildren.has_geo_json ||
        (orgunitDetailChildren.latitude && orgunitDetailChildren.longitude)
    ) {
        cy.get('@row')
            .find('td')
            .last()
            .find('button')
            .should('have.length', 3);
    } else {
        cy.get('@row')
            .find('td')
            .last()
            .find('button')
            .should('have.length', 2);
    }
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

    cy.intercept('GET', '/api/groups/', {
        fixture: `groups/list.json`,
    });
    cy.intercept(
        'GET',
        `/api/forms/?&orgUnitId=${orgUnit.id}&limit=10&order=name`,
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
    cy.intercept(
        'GET',
        `orgunits/?&parent_id=${orgUnit.id}&limit=10&page=2&order=name&validation_status=all`,
        page2,
    );
    cy.visit(baseUrl);
};
describe('children tab', () => {
    beforeEach(() => {
        goToPage();
    });

    testPermission(baseUrl);

    describe('Table', () => {
        it('should render correct infos', () => {
            cy.wait('@getOuDetail').then(() => {
                cy.get('[data-test=children-tab]').find('table').as('table');
                cy.get('@table').should('have.length', 1);
                cy.get('@table').find('tbody').find('tr').as('rows');
                cy.get('@rows').should(
                    'have.length',
                    orgUnitsChildrenList.count,
                );
                cy.get('@rows').eq(0).as('row');
                cy.get('@row').find('td').should('have.length', 10);
                cy.get('@row').find('td').eq(0).as('idCol');
                cy.get('@row').find('td').eq(1).as('nameCol');
                cy.get('@idCol').should(
                    'contain.text',
                    orgUnitsChildrenList.orgunits[0].id,
                );
                cy.get('@nameCol').should(
                    'contain.text',
                    orgUnitsChildrenList.orgunits[0].name,
                );
            });
        });

        testTablerender({
            baseUrl,
            rows: orgUnitsChildrenList.orgunits.length,
            columns: 10,
            apiPath: `orgunits/?&parent_id=${orgUnit.id}&limit=10&order=name&validation_status=all`,
            apiKey: `orgunits`,
            withVisit: false,
            selector: '[data-test="children-tab"] table',
            request: '@getOuDetail',
        });

        it('should render correct row infos', () => {
            cy.wait('@getOuDetail').then(() => {
                testRowContent(0);
            });
        });

        testPagination({
            baseUrl,
            apiPath: '/api/orgunits/**',
            query: {
                parent_id: `${orgUnit.id}`,
                limit: '10',
                order: 'name',
                validation_status: 'all',
            },
            apiKey: 'orgunits',
            withSearch: false,
            fixture: orgUnitsChildrenList,
            selector: '[data-test="children-tab"]',
        });
    });

    describe('Actions buttons', () => {
        it('should link to the right tab', () => {
            const detailsHref =
                '/dashboard/orgunits/detail/orgUnitId/69/tab/infos';

            const mapHref = '/dashboard/orgunits/detail/orgUnitId/69/tab/map';

            const historyHref =
                '/dashboard/orgunits/detail/orgUnitId/69/tab/history';

            cy.wait('@getOuDetail').then(() => {
                cy.get('table').as('table');
                cy.get('@table').find('tbody').find('tr').eq(0).as('row');

                cy.get('@row')
                    .find('td')
                    .last()
                    .find('button')
                    .eq(0)
                    .find('a')
                    .should('have.attr', 'href', detailsHref);

                cy.get('@row')
                    .find('td')
                    .last()
                    .find('button')
                    .eq(1)
                    .find('a')
                    .should('have.attr', 'href', mapHref);

                cy.get('@row')
                    .find('td')
                    .last()
                    .find('button')
                    .eq(2)
                    .find('a')
                    .should('have.attr', 'href', historyHref);
            });
        });
    });

    describe('Filters', () => {
        it('change filters should deep link and call api with correct params', () => {
            cy.wait('@getOuDetail').then(() => {
                interceptFlag = false;
                cy.intercept(
                    {
                        method: 'GET',
                        pathname: '/api/orgunits/**',
                        query: {
                            ...defaultQuery,
                            search: newFilters.childrenParamsSearch.urlValue,
                            orgUnitTypeId:
                                newFilters.childrenParamsOrgUnitTypeId.urlValue,
                            withLocation:
                                newFilters.childrenParamsWithLocation.urlValue,
                            withShape:
                                newFilters.childrenParamsWithShape.urlValue,
                            group: newFilters.childrenParamsGroup.urlValue,
                            hasInstances:
                                newFilters.childrenParamsHasInstances.urlValue,
                            validation_status:
                                newFilters.childrenParamsValidation_status
                                    .urlValue,
                        },
                    },
                    req => {
                        interceptFlag = true;
                        req.reply({
                            statusCode: 200,
                            body: orgUnitsChildrenList,
                        });
                    },
                ).as('getChildrenSearch');
                testPageFilters(
                    newFilters,
                    '[data-test="children-tab"] [data-test="search-button"]',
                );

                cy.wait('@getChildrenSearch').then(() => {
                    cy.wrap(interceptFlag).should('eq', true);
                });
            });
        });
    });

    describe('Export csv/xlsx/gpkg buttons', () => {
        it('should download file via out own anchor click', () => {
            testDownloadButtons(
                '[data-test="children-tab"] [data-test="download-buttons"]',
                'orgunits',
            );
        });
    });
});
