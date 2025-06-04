/// <reference types="cypress" />

import moment from 'moment';
import orgUnit from '../../fixtures/orgunits/details.json';
import orgUnitsList from '../../fixtures/orgunits/list.json';
import { testPermission } from '../../support/testPermission';

const siteBaseUrl = Cypress.env('siteBaseUrl');

const baseUrl = `${siteBaseUrl}/dashboard/orgunits/detail/accountId/1/orgUnitId/${orgUnit.id}/levels/1,2/tab/infos`;

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

const testReadableInfos = ou => {
    const createdAt = moment.unix(ou.created_at).format('DD/MM/YYYY HH:mm');
    const updatedAt = moment.unix(ou.updated_at).format('DD/MM/YYYY HH:mm');

    cy.get('[data-test="source"]').should('contain', ou.source);
    if (ou.creator) {
        cy.get('[data-test="creator"]').should('contain', ou.creator);
    } else {
        cy.get('[data-test="creator"]').should('contain', '-');
    }
    cy.get('[data-test="created_at"]').should('contain', createdAt);
    cy.get('[data-test="updated_at"]').should('contain', updatedAt);

    if (ou.latitude && ou.longitude) {
        cy.get('[data-test="latitude"]').should('contain', ou.latitude);
        cy.get('[data-test="longitude"]').should('contain', ou.longitude);
    }
};

const mockCalls = () => {
    cy.intercept('GET', '/api/profiles/**', {
        fixture: 'profiles/list.json',
    }).as('profiles');
    cy.intercept('GET', '/api/profiles/me/**', {
        fixture: 'profiles/me/superuser.json',
    }).as('me');
    cy.intercept('GET', `/api/profiles/`, {
        fixture: `profiles/list.json`,
    }).as('profilesList');
    cy.intercept('GET', `/api/orgunits/${orgUnit.id}/`, {
        fixture: `orgunits/details.json`,
    }).as('getOuDetail');
    cy.intercept('GET', `/api/orgunits/1/`, {
        fixture: `orgunits/parent.json`,
    }).as('getOuDetail');
    cy.intercept('GET', `/api/algorithms/`, {
        fixture: `algorithms/list.json`,
    }).as('algos');
    cy.intercept('GET', `/api/algorithmsruns/`, {
        fixture: `algorithmsruns/list.json`,
    }).as('runs');
    cy.intercept('GET', '/api/v2/orgunittypes/', {
        fixture: `orgunittypes/list.json`,
    }).as('OUTypes');
    cy.intercept('GET', '/api/groups/dropdown/**/*', {
        fixture: `groups/dropdownlist.json`,
    }).as('groupsOptions');
    cy.intercept('GET', '/api/groups/', {
        fixture: `groups/list.json`,
    }).as('groups');
    // cy.intercept('GET', '/api/groups/**/*', {
    //     fixture: `groups/list.json`,
    // }).as('groupsDetails');
    cy.intercept('GET', '/api/validationstatus/', {
        fixture: `misc/validationStatuses.json`,
    }).as('statuses');
    cy.intercept(
        'GET',
        ` /api/forms/?&orgUnitId=${orgUnit.id}&limit=10&order=name`,
        {
            fixture: `forms/list.json`,
        },
    ).as('forms');

    cy.intercept(
        'GET',
        `/api/logs/?&objectId=${orgUnit.id}&contentType=iaso.orgunit&limit=10&order=-created_at`,
        {
            fixture: `logs/list-linked-paginated.json`,
        },
    ).as('logs');
    cy.intercept('GET', `/api/datasources/33/`, {
        fixture: `datasources/details.json`,
    });
    cy.intercept('GET', `/api/datasources/?linkedTo=${orgUnit.id}`, {
        fixture: `datasources/details-ou.json`,
    }).as('sources');
    cy.intercept('GET', `/api/datasources/?linkedTo=${orgUnit.id}/**/*`, {
        fixture: `datasources/details-ou.json`,
    }).as('sourcesParams');
    cy.intercept(
        'GET',
        `/api/comments/?object_pk=${orgUnit.id}&content_type=iaso-orgunit&limit=4`,
        {
            fixture: `comments/list.json`,
        },
    ).as('comments');
    cy.intercept(
        'GET',
        `/api/orgunits/?&parent_id=${orgUnit.id}&limit=10&order=name&validation_status=all`,
        {
            fixture: 'orgunits/details-children-paginated.json',
        },
    ).as('children');
    cy.intercept('GET', `/api/links/?orgUnitId=${orgUnit.id}`, {
        fixture: 'links/list-linked.json',
    }).as('links');
    cy.intercept(
        'GET',
        `/api/links/?&orgUnitId=${orgUnit.id}&limit=10&order=similarity_score`,
        {
            fixture: 'links/list-linked-paginated.json',
        },
    ).as('linksPaginated');
    cy.intercept('GET', `/api/instances/?order=id&orgUnitId=${orgUnit.id}`, {
        instances: [],
    }).as('submissions');
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
    ).as('OUsearch');

    cy.intercept(
        'GET',
        `/api/orgunits/?&orgUnitParentId=${orgUnit.id}&orgUnitTypeId=11&withShapes=true&validation_status=all`,
        {
            fixture: 'orgunits/empty.json',
        },
    );
};

describe('infos tab', () => {
    beforeEach(() => {
        cy.login();
        mockCalls();
    });

    it('page should not be accessible if user does not have permission', () => {
        testPermission(baseUrl);
    });

    it('should render correct infos', () => {
        cy.visit(baseUrl);
        cy.wait(['@getOuDetail', '@groupsOptions']).then(() => {
            testEditableInfos(orgUnit);
            testReadableInfos(orgUnit);
        });
    });

    it('should save new infos', () => {
        cy.intercept(
            'GET',
            `/api/orgunits/treesearch/?&rootsForUser=true&source=${orgUnit.source_id}&validation_status=VALID&ignoreEmptyNames=true`,
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

            cy.get('#array-input-field-list-aliases')
                .find(`#aliases-0`)
                .parent()
                .next()
                .click();
            cy.fillArrayInputField('aliases', newOu.aliases);
            cy.fillTreeView('#ou-tree-input', newSourceIndex);

            cy.intercept('GET', `/api/orgunits/${orgUnit.id}`, newOu).as(
                'getNewOuDetail',
            );
            cy.get('#save-ou').click();
            // FIXME this is flaky and will sometimes timeout and fail while running npm run test:e2e
            cy.wait('@saveOu').then(() => {
                cy.wrap(interceptFlag).should('eq', true);
                testEditableInfos(newOu, 'VALIDATED');
            });
        });
    });
    it('should create new org unit', () => {
        mockCalls();
        cy.visit(`${siteBaseUrl}/dashboard/orgunits/detail/orgUnitId/0`);

        cy.intercept(
            {
                method: 'POST',
                pathname: '/api/orgunits/create_org_unit/',
            },
            req => {
                interceptFlag = true;
                req.reply({
                    statusCode: 200,
                    body: {
                        ...orgUnit,
                    },
                });
            },
        ).as('saveOu');
        cy.fillTextField('#input-text-name', orgUnit.name);
        cy.fillSingleSelect('#org_unit_type_id', 0);
        cy.fillMultiSelect('#groups', [0, 1], false);
        cy.fillSingleSelect('#validation_status', 0);
        cy.fillTextField('#input-text-source_ref', orgUnit.source_ref);
        cy.fillArrayInputField('aliases', orgUnit.aliases);
        cy.fillTreeView('#ou-tree-input', 0, false);
        cy.get('#save-ou').click();
        cy.wait('@saveOu').then(() => {
            cy.wrap(interceptFlag).should('eq', true);
            cy.url().should('eq', baseUrl);
        });
    });
});
