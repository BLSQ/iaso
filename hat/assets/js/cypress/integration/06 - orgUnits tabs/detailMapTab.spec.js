/// <reference types="cypress" />

import linkedList from '../../fixtures/links/list-linked.json';
import orgUnit from '../../fixtures/orgunits/details.json';
import { testPermission } from '../../support/testPermission';

const siteBaseUrl = Cypress.env('siteBaseUrl');

const baseUrl = `${siteBaseUrl}/dashboard/orgunits/detail/orgUnitId/${orgUnit.id}/tab/map`;

const interceptList = [
    'profiles',
    'algorithms',
    'algorithmsruns',
    // 'orgunittypes',
];

/**
 * TODO;
 * - test sources, types and forms update => should update map
 * - test map sub tabs changes and sub components
 * - test ou with only a location
 * - test edition of location / catchment
 */

describe('map tab', () => {
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
        cy.intercept('GET', '/api/v2/orgunittypes/', {
            fixture: `orgunittypes/list.json`,
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
        cy.intercept(
            'GET',
            `/api/instances/?order=id&orgUnitId=${orgUnit.id}`,
            {
                instances: [],
            },
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

        cy.visit(`${baseUrl}`);
    });

    it('page should not be accessible if user does not have permission', () => {
        testPermission(baseUrl);
    });

    it('should render correct infos', () => {
        cy.wait('@getOuDetail').then(() => {
            cy.log('displays map and shape');
            cy.get('.leaflet-container').should('be.visible');
            cy.get('.leaflet-custom-shape-location-pane svg').should(
                'be.visible',
            );
            cy.log('displays linked sources');
            linkedList.links.forEach(l => {
                cy.get('#sources').parent().should('contain', l.source.source);
            });

            cy.log('displays direct ou children');
            cy.get('#ou-types')
                .parent()
                .should(
                    'contain',
                    orgUnit.org_unit_type.sub_unit_types[0].short_name,
                );
        });
    });
});
