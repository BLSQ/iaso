/// <reference types="cypress" />
import moment from 'moment';
import emptyFixture from '../../../fixtures/orgunits/changes/configuration/empty.json';
import page2 from '../../../fixtures/orgunits/changes/configuration/orgUnitChangeConfigurations-page2.json';
import listFixture from '../../../fixtures/orgunits/changes/configuration/orgUnitChangeConfigurations.json';
import orgUnitTypesFixture from '../../../fixtures/orgunittypes/dropdown-list.json';
import superUser from '../../../fixtures/profiles/me/superuser.json';
import projectsFixture from '../../../fixtures/projects/list.json';
import { testPageFilters } from '../../../support/testPageFilters';
import { testPagination } from '../../../support/testPagination';
import { testTablerender } from '../../../support/testTableRender';
import { testTableSort } from '../../../support/testTableSort';

const siteBaseUrl = Cypress.env('siteBaseUrl');
const baseUrl = `${siteBaseUrl}/dashboard/validation/changeRequestConfig`;

let interceptFlag = false;
const defaultQuery = {
    limit: '10',
    order: '-updated_at',
};
const newFilters = {
    project_id: {
        value: 1,
        urlValue: '1',
        selector: '#project_id',
        type: 'single',
        clear: false,
    },
    org_unit_type_id: {
        value: 11,
        urlValue: '11',
        selector: '#org_unit_type_id',
        type: 'single',
        clear: false,
    },
};

const goToPage = (
    // eslint-disable-next-line default-param-last
    fakeUser = superUser,
    formQuery,
    fixture = listFixture,
    url = baseUrl,
) => {
    cy.login();
    interceptFlag = false;
    cy.intercept('GET', '/sockjs-node/**');
    cy.intercept('GET', '/api/profiles/me/**', fakeUser);
    cy.intercept('GET', '/api/projects/**', projectsFixture);
    cy.intercept('GET', '/api/v2/orgunittypes/dropdown/', orgUnitTypesFixture);

    const options = {
        method: 'GET',
        pathname: '/api/orgunits/changes/configs/**',
    };
    const query = {
        ...defaultQuery,
        ...formQuery,
    };
    cy.intercept({ ...options, query }, req => {
        interceptFlag = true;
        req.reply({
            statusCode: 200,
            body: fixture,
        });
    }).as('getOrgUnitChangeConfigs');
    cy.visit(url);
};

const withRowAt = (index, block) => {
    cy.get('table').as('table');
    cy.get('@table').find('tbody').find('tr').eq(index).as('row');
    block({
        colAt: i => cy.get('@row').find('td').eq(i),
    });
};

const formatDate = date => moment.unix(date).format('DD/MM/YYYY HH:mm');

const testRowContent = (index, config = listFixture.results[index]) => {
    withRowAt(index, r => {
        r.colAt(0).should('contain', config.id);
        r.colAt(1).should('contain', config.project.name);
        r.colAt(2).should(
            'contain',
            config.type === 'edition' ? 'Edition' : 'Creation',
        );
        r.colAt(3).should('contain', config.org_unit_type.name);
        r.colAt(4).should('contain', formatDate(config.created_at));
        r.colAt(5).should('contain', formatDate(config.updated_at));
        r.colAt(6)
            .find('.MuiChip-label')
            .should(labels => {
                const labelTexts = [...labels].map(label => label.textContent);
                expect(labelTexts).to.include.members(['1', '2', '3']);
            });
    });
};

const withActionColAt = (index, block) =>
    withRowAt(1, r => block(r.colAt(index).as('actionCol')));

const openDialogToDeleteIndex = index =>
    withRowAt(index, r => r.colAt(7).find('button').eq(1).click());

describe('OrgUnit Change Configuration', () => {
    it('Api should be called with base params', () => {
        goToPage(superUser, {}, emptyFixture);
        cy.wait('@getOrgUnitChangeConfigs').then(() => {
            cy.wrap(interceptFlag).should('eq', true);
        });
    });

    describe('page', () => {
        it('page should not be accessible if user does not have permission', () => {
            goToPage({
                ...superUser,
                permissions: [],
                is_superuser: false,
            });
            const errorCode = cy.get('#error-code');
            errorCode.should('contain', '403');
        });
    });
    describe('Table', () => {
        beforeEach(() => {
            goToPage();
            cy.intercept(
                'GET',
                '/api/orgunits/changes/configs/**/?order=-updated_at&limit=10&page=2',
                page2,
            );
        });
        testTablerender({
            baseUrl,
            rows: listFixture.results.length,
            columns: 8,
            withVisit: false,
            apiKey: 'orgunits/changes/configs',
        });
        testPagination({
            baseUrl,
            apiPath: '/api/orgunits/changes/configs/**',
            apiKey: 'results',
            withSearch: false,
            fixture: listFixture,
            query: {
                limit: '10',
                order: '-updated_at',
            },
        });
        it('should render correct row infos', () => {
            cy.wait('@getOrgUnitChangeConfigs').then(() => {
                testRowContent(0);
            });
        });

        describe('Action columns', () => {
            it('should display correct amount of buttons', () => {
                cy.wait('@getOrgUnitChangeConfigs').then(() => {
                    withActionColAt(7, actionCol =>
                        actionCol.find('button').should('have.length', 2),
                    );
                });
            });

            it('should display delete dialog and delete', () => {
                goToPage();
                cy.intercept('DELETE', '/api/orgunits/changes/configs/1', {
                    statusCode: 200,
                }).as('deleteOrgUnitChangeConfigsSearch');
                cy.wait('@getOrgUnitChangeConfigs').then(() => {
                    const orgUnitChangeIndex = 0;
                    openDialogToDeleteIndex(orgUnitChangeIndex);
                    cy.get('#delete-notification')
                        .find('button')
                        .eq(1)
                        .click()
                        .then(() =>
                            cy.wait('@deleteOrgUnitChangeConfigsSearch'),
                        );
                });
            });
        });
        it('sort should deep link and call api with correct params', () => {
            cy.wait('@getOrgUnitChangeConfigs').then(() => {
                const sorts = [
                    {
                        colIndex: 0,
                        order: 'id',
                    },
                    {
                        colIndex: 1,
                        order: 'project',
                    },
                    {
                        colIndex: 2,
                        order: 'type',
                    },
                    {
                        colIndex: 3,
                        order: 'org_unit_type__name',
                    },
                    {
                        colIndex: 4,
                        order: 'created_at',
                    },
                    {
                        colIndex: 5,
                        order: 'updated_at',
                    },
                ];
                sorts.forEach(s => {
                    testTableSort({
                        colIndex: s.colIndex,
                        order: s.order,
                        apiPath: 'orgunits/changes/configs',
                        fixture: listFixture,
                        defaultQuery,
                        refetchDefault: false,
                    });
                });
            });
        });
    });

    describe('Filters', () => {
        beforeEach(() => {
            goToPage();
        });
        it('change filters should deep link and call api with correct params', () => {
            cy.wait('@getOrgUnitChangeConfigs').then(() => {
                cy.intercept(
                    {
                        method: 'GET',
                        pathname: '/api/orgunits/changes/configs/**',
                    },
                    {
                        ...defaultQuery,
                        project_id: newFilters.project,
                        type: 'creation',
                        org_unit_type_id: newFilters.org_unit_type_id.urlValue,
                    },

                    req => {
                        interceptFlag = true;
                        req.reply({
                            statusCode: 200,
                            body: listFixture,
                        });
                    },
                ).as('getOrgUnitChangeConfigsSearch');
                cy.get('#project_id').type('Test2.35.3');
                cy.wait(800);
                cy.get('#project_id').type('{downarrow}').type('{enter}');
                cy.get('#type').type('{downarrow}').type('{enter}');
                cy.get('#org_unit_type_id').type('Org Unit Type 2');
                cy.wait(800);
                cy.get('#org_unit_type_id').type('{downarrow}').type('{enter}');
                testPageFilters(newFilters);
                cy.wait('@getOrgUnitChangeConfigsSearch').then(() => {
                    cy.wrap(interceptFlag).should('eq', true);
                });
            });
        });
    });
});
