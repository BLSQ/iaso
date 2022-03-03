/// <reference types="cypress" />
import moment from 'moment';

import superUser from '../../fixtures/profiles/me/superuser.json';
import orgUnit from '../../fixtures/orgunits/details.json';
import orgUnitsList from '../../fixtures/orgunits/list.json';
import linkedList from '../../fixtures/links/list-linked.json';
import linkedListPaginated from '../../fixtures/links/list-linked-paginated.json';
import orgUnitsChildrenList from '../../fixtures/orgunits/details-children-paginated.json';
import linkedLogsPaginated from '../../fixtures/logs/list-linked-paginated.json';
import formsList from '../../fixtures/forms/list.json';
import commentsList from '../../fixtures/comments/list.json';

const siteBaseUrl = Cypress.env('siteBaseUrl');

const baseUrl = `${siteBaseUrl}/dashboard/orgunits/detail/orgUnitId/${orgUnit.id}`;

const interceptList = [
    'profiles',
    'algorithms',
    'algorithmsruns',
    'groups',
    'orgunittypes',
];

const newSourceIndex = 2;
const ouChanges = {
    name: 'ZELDA',
    source_ref: 'NINTENDO',
    source_id: orgUnitsList[newSourceIndex],
    org_unit_type: {
        id: 11,
        name: 'Org Unit Type 2',
        short_name: 'Org Unit Type 2',
        created_at: 1633954017.101693,
        updated_at: 1633954017.101713,
        depth: null,
        sub_unit_types: [],
    },
    org_unit_type_id: 11,
    groups: [
        {
            name: 'GORONS',
            id: 3,
            source_ref: null,
            created_at: 1571409554.831856,
            updated_at: 1571409554.831875,
            source_version: 5,
        },
        {
            name: 'GERUDO',
            id: 4,
            source_ref: 'RpbiCJpIYEj',
            created_at: 1571409554.831856,
            updated_at: 1571409554.831875,
            source_version: 5,
        },
    ],
    validation_status: 'VALIDATED',
    aliases: ['LINK', 'LUIGI'],
};

let interceptFlag = false;

const testEditableInfos = (ou, validationStatus = 'New') => {
    cy.testInputValue('#input-text-name', ou.name);
    cy.testInputValue('#org_unit_type_id', ou.org_unit_type.name);
    cy.testMultiSelect('#groups', ou.groups);
    cy.testInputValue('#validation_status', validationStatus);
    cy.testInputValue('#input-text-source_ref', ou.source_ref);
    ou.aliases.forEach((a, i) => {
        cy.testInputValue(`#aliases-${i}`, a);
    });
    cy.get('#ou-tree-input').as('ouTreeInput');
    cy.get('@ouTreeInput').should('contain', ou.parent.short_name);
};

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
                testEditableInfos(orgUnit);
                cy.testInputValue('#input-text-source', orgUnit.source);
                cy.testInputValue(
                    '#input-text-created_at',
                    moment.unix(orgUnit.created_at).format('DD/MM/YYYY HH:mm'),
                );
                cy.testInputValue(
                    '#input-text-updated_at',
                    moment.unix(orgUnit.updated_at).format('DD/MM/YYYY HH:mm'),
                );
            });
        });
        it('should save new infos', () => {
            cy.intercept(
                'GET',
                `/api/orgunits/?&rootsForUser=true&source=${orgUnit.source_id}&validation_status=all&treeSearch=true&ignoreEmptyNames=true`,
                {
                    fixture: 'orgunits/list.json',
                },
            );
            cy.visit(baseUrl);
            cy.wait('@getOuDetail').then(() => {
                const newOu = {
                    ...orgUnit,
                    ...ouChanges,
                };
                cy.intercept(
                    {
                        method: 'PATCH',
                        pathname: `/api/orgunits/${orgUnit.id}`,
                    },
                    req => {
                        interceptFlag = true;
                        req.reply({
                            statusCode: 200,
                            body: newOu,
                        });
                    },
                ).as('saveOu');
                cy.fillTextField('#input-text-name', newOu.name);
                cy.fillSingleSelect('#org_unit_type_id', 1);
                cy.fillMultiSelect('#groups', [2, 3]);
                cy.fillSingleSelect('#validation_status', 1);
                cy.fillTextField('#input-text-source_ref', newOu.source_ref);
                cy.fillArrayInputField('aliases', newOu.aliases);
                cy.fillTreeView('#ou-tree-input', newSourceIndex);

                cy.get('#save-ou').click();
                // FIXME this is flaky and will sometimes timeout and fail while running npm run test:e2e
                cy.wait('@saveOu').then(() => {
                    cy.wrap(interceptFlag).should('eq', true);
                    testEditableInfos(newOu, 'VALIDATED');
                });
            });
        });
    });

    /**
     * TODO;
     * - test sources, types and forms update => should update map
     * - test map sub tabs changes and sub components
     * - test ou with only a location
     * - test edition of location / catchment
     */
    describe('map tab', () => {
        it('should render correct infos', () => {
            cy.visit(`${baseUrl}/tab/map`);

            cy.wait('@getOuDetail').then(() => {
                cy.log('displays map and shape');
                cy.get('.leaflet-container').should('be.visible');
                cy.get('.leaflet-custom-shape-location-pane svg').should(
                    'be.visible',
                );
                cy.log('displays linked sources');
                linkedList.links.forEach(l => {
                    cy.get('#sources')
                        .parent()
                        .should('contain', l.source.source);
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

    /**
     * TODO;
     * - test filters
     * - test export buttons
     * - test actions buttons
     */
    describe('children tab', () => {
        it('should render correct infos', () => {
            cy.visit(`${baseUrl}/tab/children`);

            cy.wait('@getOuDetail').then(() => {
                cy.get('#children-tab').find('table').as('table');
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
    });

    /**
     * TODO;
     * - test filters
     * - test export buttons
     * - test actions buttons
     */
    describe('links tab', () => {
        it('should render correct infos', () => {
            cy.visit(`${baseUrl}/tab/links`);

            cy.wait('@getOuDetail').then(() => {
                cy.get('#links-tab').find('table').as('table');
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
    });

    /**
     * TODO;
     * - test actions buttons
     */

    describe('history tab', () => {
        it('should render correct infos', () => {
            cy.visit(`${baseUrl}/tab/history`);

            cy.wait('@getOuDetail').then(() => {
                cy.get('#logs-tab').find('table').as('table');
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
    });

    /**
     * TODO;
     * - test actions buttons
     */
    describe('forms tab', () => {
        it('should render correct infos', () => {
            cy.visit(`${baseUrl}/tab/forms`);

            cy.wait('@getOuDetail').then(() => {
                cy.get('#forms-tab').find('table').as('table');
                cy.get('@table').should('have.length', 1);
                cy.get('@table').find('tbody').find('tr').as('rows');
                cy.get('@rows').should('have.length', formsList.count);
                cy.get('@rows').eq(0).as('row');
                cy.get('@row').find('td').should('have.length', 10);
                cy.get('@row').find('td').eq(0).as('nameCol');

                cy.get('@nameCol').should(
                    'contain.text',
                    formsList.forms[0].name,
                );
            });
        });
    });

    /**
     * TODO;
     * - test posting new comment
     * - test add reply
     * - test show thread button
     */
    describe('forms tab', () => {
        it('should render correct infos', () => {
            cy.visit(`${baseUrl}/tab/comments`);

            cy.wait('@getOuDetail').then(() => {
                cy.get('#comments-tab').as('commentsTab').should('be.visible');
                cy.get('@commentsTab')
                    .find('.comments-list')
                    .as('commentsList')
                    .find('> div')
                    .should('have.length', commentsList.count);
            });
        });
    });
});
