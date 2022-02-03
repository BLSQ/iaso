/// <reference types="cypress" />
import moment from 'moment';

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

const testInfos = ou => {
    cy.testInputValue('#input-text-name', ou.name);
    cy.testInputValue('#org_unit_type_id', ou.org_unit_type.name);
    cy.testMultiSelect('#groups', ou.groups);
    cy.testInputValue('#validation_status', 'New');
    cy.testInputValue('#input-text-source_ref', ou.source_ref);
    ou.aliases.forEach((a, i) => {
        cy.testInputValue(`#aliases-${i}`, a);
    });
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
        cy.intercept('GET', `/api/datasources/?linkedTo=${orgUnit.id}`, {
            fixture: `datasources/details-ou.json`,
        });
        cy.intercept('GET', `/api/orgunits/${orgUnit.id}`, {
            fixture: 'orgunits/details.json',
        }).as('getOuDetail');
        cy.intercept(
            'GET',
            `/api/orgunits/?&orgUnitParentId=${orgUnit.id}&orgUnitTypeId=7&withShapes=true&valid`,
            { orgUnits: [] },
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
    describe.only('infos tab', () => {
        it('should render correct infos', () => {
            cy.visit(baseUrl);
            cy.wait('@getOuDetail').then(() => {
                testInfos(orgUnit);
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
            cy.visit(baseUrl);
            cy.wait('@getOuDetail').then(() => {
                const newOu = {
                    name: 'ZELDA',
                    org_unit_type: {
                        name: 'MARIO',
                    },
                    groups: [
                        {
                            name: 'GORONS',
                        },
                        {
                            name: 'GERUDO',
                        },
                    ],
                    validation_status: 'VALIDATED',
                    aliases: ['LINK', 'LUIGI'],
                };
                // change values
                testInfos(newOu);
            });
        });
    });
});
