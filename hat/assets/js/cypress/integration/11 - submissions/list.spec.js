/// <reference types="cypress" />

import superUser from '../../fixtures/profiles/me/superuser.json';
import listFixture from '../../fixtures/submissions/list.json';
import emptyFixture from '../../fixtures/submissions/empty.json';
import formDetail from '../../fixtures/forms/detail.json';
import possibleFields from '../../fixtures/forms/possibleFields.json';
import page2 from '../../fixtures/submissions/list_page2.json';

import { testTablerender } from '../../support/testTableRender';
import { testPagination } from '../../support/testPagination';
import { testTableSort } from '../../support/testTableSort';
import { testPageFilters } from '../../support/testPageFilters';
import { testSearchField } from '../../support/testSearchField';
import { search, searchWithForbiddenChars } from '../../constants/search';

const siteBaseUrl = Cypress.env('siteBaseUrl');
const baseUrl = `${siteBaseUrl}/dashboard/forms/submissions/tab/list/mapResults/3000`;

let interceptFlag = false;
let table;
let row;
const defaultQuery = {
    limit: '10',
    order: '-updated_at',
    page: '1',
    asSmallDict: 'true',
};

const newFilters = {
    search: {
        value: 'ZELDA',
        urlValue: 'ZELDA',
        selector: '#search-search',
        type: 'text',
    },
    formIds: {
        value: [0],
        urlValue: '1',
        selector: '#formIds',
        type: 'multi',
    },
    levels: {
        value: 2,
        urlValue: '3',
        selector: '#ou-tree-input',
        type: 'tree',
    },
    orgUnitTypeId: {
        value: [0],
        urlValue: '47',
        selector: '#orgUnitTypeId',
        type: 'multi',
    },
    mapResults: {
        value: '100',
        urlValue: '100',
        selector: '#input-text-mapResults',
        type: 'text',
    },
    status: {
        value: [0],
        urlValue: 'READY',
        selector: '#status',
        type: 'multi',
    },
    withLocation: {
        value: [0],
        urlValue: 'true',
        selector: '#withLocation',
        type: 'multi',
    },
    dateFrom: {
        value: '10032022',
        urlValue: '10-03-2022',
        apiValue: '2022-03-10 00:00',
        selector: '[data-test="start-date"] input',
        type: 'text',
    },
    dateTo: {
        value: '10032023',
        urlValue: '10-03-2023',
        apiValue: '2023-03-10 23:59',
        selector: '[data-test="end-date"] input',
        type: 'text',
    },
};

const goToPage = (
    fakeUser = superUser,
    formQuery,
    fixture = listFixture,
    url = baseUrl,
) => {
    cy.login();
    interceptFlag = false;
    cy.intercept('GET', '/sockjs-node/**');
    cy.intercept('GET', '/api/profiles/me/**', fakeUser);
    cy.intercept('GET', '/api/v2/orgunittypes/', {
        fixture: 'orgunittypes/list.json',
    });
    cy.intercept(
        'GET',
        '/api/forms/?all=true&order=name&fields=name%2Cperiod_type%2Clabel_keys%2Cid%2Clatest_form_version',
        {
            fixture: 'forms/list.json',
        },
    );
    cy.intercept('GET', '/api/formversions/**', {
        fixture: 'devicesownerships/list.json',
    });
    const options = {
        method: 'GET',
        pathname: '/api/instances/**',
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
    }).as('getSubmissions');
    cy.visit(url);
};

const testRowContent = (index, p = listFixture.instances[index]) => {
    cy.get('table').as('table');
    cy.get('@table').find('tbody').find('tr').eq(index).as('row');
    cy.get('@row').find('td').eq(0).should('contain', p.form_name);
    cy.get('@row').find('td').eq(3).should('contain', p.org_unit.name);
};

const getActionCol = (index = 0) => {
    table = cy.get('table');
    row = table.find('tbody').find('tr').eq(1);
    row.find('td').eq(index).as('actionCol');
};

describe('Submissions', () => {
    it('Api should be called with base params', () => {
        goToPage(superUser, {}, emptyFixture);
        cy.wait('@getSubmissions').then(() => {
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
        describe('Search field', () => {
            beforeEach(() => {
                goToPage();
            });

            testSearchField(search, searchWithForbiddenChars);
        });
    });
    describe('Table', () => {
        beforeEach(() => {
            goToPage();
            cy.intercept(
                'GET',
                '/api/instances/?limit=10&order=id&page=2&asSmallDict=true',
                page2,
            );
        });
        testTablerender({
            baseUrl,
            rows: listFixture.instances.length,
            columns: 7,
            withVisit: false,
            apiKey: 'instances',
        });
        testPagination({
            baseUrl,
            apiPath: '/api/instances/**',
            apiKey: 'instances',
            withSearch: false,
            fixture: listFixture,
        });
        it('should render correct row infos', () => {
            cy.wait('@getSubmissions').then(() => {
                testRowContent(0);
            });
        });

        describe('Action columns', () => {
            it('should display correct amount of buttons', () => {
                cy.wait('@getSubmissions').then(() => {
                    getActionCol(5);
                    cy.get('@actionCol')
                        .find('button')
                        .should('have.length', 2);
                });
            });
            // This test is flakey
            it('buttons should link to submission', () => {
                cy.wait('@getSubmissions').then(() => {
                    getActionCol(5);
                    cy.get('@actionCol')
                        .find('button')
                        .eq(0)
                        .find('a')
                        .should(
                            'have.attr',
                            'href',
                            '/dashboard/forms/submission/instanceId/1',
                        );
                });
            });
            it('buttons should link to linked org unit', () => {
                cy.wait('@getSubmissions').then(() => {
                    getActionCol(5);
                    cy.get('@actionCol')
                        .find('button')
                        .eq(1)
                        .find('a')
                        .should(
                            'have.attr',
                            'href',
                            '/dashboard/orgunits/detail/orgUnitId/1/formId/1/instanceId/1',
                        );
                });
            });
            it('form name should link to submission link', () => {
                cy.wait('@getSubmissions').then(() => {
                    table = cy.get('table');
                    row = table.find('tbody').find('tr').eq(1);
                    row.find('td')
                        .eq(0)
                        .find('a')
                        .should(
                            'have.attr',
                            'href',
                            '/dashboard/forms/detail/formId/1',
                        );
                });
            });
        });
        it('sort should deep link and call api with correct params', () => {
            cy.wait('@getSubmissions').then(() => {
                const sorts = [
                    {
                        colIndex: 1,
                        order: 'updated_at',
                    },
                    {
                        colIndex: 2,
                        order: 'period',
                    },
                    {
                        colIndex: 3,
                        order: 'org_unit__name',
                    },
                    {
                        colIndex: 4,
                        order: 'status',
                    },
                ];
                sorts.forEach(s => {
                    testTableSort({
                        colIndex: s.colIndex,
                        order: s.order,
                        apiPath: 'instances',
                        fixture: listFixture,
                        defaultQuery,
                    });
                });
            });
        });
    });

    it('change filters should deep link and call api with correct params', () => {
        cy.intercept(
            'GET',
            '/api/orgunits/treesearch/?&rootsForUser=true&defaultVersion=true&validation_status=all&ignoreEmptyNames=true',
            {
                fixture: 'orgunits/list.json',
            },
        ).as('getOrgunits');
        cy.intercept(
            'GET',
            '/api/forms/1/?fields=name,period_type,label_keys,id,org_unit_type_ids',
            {
                fixture: 'forms/detail.json',
            },
        );
        cy.intercept('GET', '/api/forms/1/?fields=possible_fields', {
            fixture: 'forms/possibleFields.json',
        });
        cy.intercept('GET', '/api/orgunits/3/', {
            fixture: 'orgunits/details.json',
        });
        goToPage();
        cy.wait('@getSubmissions').then(() => {
            interceptFlag = false;
            cy.intercept(
                {
                    method: 'GET',
                    pathname: '/api/instances/**',
                    query: {
                        ...defaultQuery,
                        withLocation: newFilters.withLocation.urlValue,
                        orgUnitTypeId: newFilters.orgUnitTypeId.urlValue,
                        status: newFilters.status.urlValue,
                        search: newFilters.search.urlValue,
                        orgUnitParentId: newFilters.levels.urlValue,
                        dateFrom: newFilters.dateFrom.apiValue,
                        dateTo: newFilters.dateTo.apiValue,
                        form_ids: newFilters.formIds.urlValue,
                    },
                },
                req => {
                    interceptFlag = true;
                    req.reply({
                        statusCode: 200,
                        body: listFixture,
                    });
                },
            ).as('getSubmissionsSearch');
            testPageFilters(newFilters);

            cy.wait('@getSubmissionsSearch').then(() => {
                cy.wrap(interceptFlag).should('eq', true);
            });
        });
    });

    it('period picker should correctly deep link changes and call api with correct params', () => {
        goToPage();
        const fillPeriodPicker = (id, optionId, defaultValueIndex = 0) => {
            cy.get(id).as('multiSelect');
            cy.get('@multiSelect').click();
            cy.get(`${optionId}-option-${defaultValueIndex}`).click();
            cy.get('@multiSelect').click();
            cy.get('body').click();
        };
        const testPeriod = (periodTypeIndex, startPeriod, endPeriod) => {
            const mapping = ['#day', '#month', '#quarter'];
            const secondId = mapping[periodTypeIndex];
            cy.fillMultiSelect('#periodType', [periodTypeIndex], false);
            cy.get('[data-test="search-button"]').as('searchButton');
            fillPeriodPicker('#startPeriod #year', '#year');
            if (secondId) {
                cy.get('@searchButton').should('be.disabled');
                fillPeriodPicker(`#startPeriod ${secondId}`, secondId);
                cy.get('@searchButton').should('not.be.disabled');
            }
            fillPeriodPicker('#endPeriod #year', '#year', 1);
            if (secondId) {
                cy.get('@searchButton').should('be.disabled');
                fillPeriodPicker(`#endPeriod ${secondId}`, secondId);
            }

            cy.get('@searchButton').should('not.be.disabled');
            interceptFlag = false;
            cy.intercept(
                {
                    method: 'GET',
                    pathname: '/api/instances/**',
                    query: {
                        ...defaultQuery,
                        startPeriod,
                        endPeriod,
                    },
                },
                req => {
                    interceptFlag = true;
                    req.reply({
                        statusCode: 200,
                        body: listFixture,
                    });
                },
            ).as('getSubmissionsSearch');
            cy.get('@searchButton').click();

            cy.url().should(
                'contain',
                `/startPeriod/${startPeriod}/endPeriod/${endPeriod}`,
            );
            cy.wait('@getSubmissionsSearch').then(() => {
                cy.wrap(interceptFlag).should('eq', true);
            });
        };
        cy.wait('@getSubmissions').then(() => {
            // TODO: test new period type day
            testPeriod(1, '201401', '201501');
            testPeriod(2, '2014Q1', '2015Q1');
            testPeriod(3, '2014', '2015');
        });
    });

    it('columns selection should render correctly ', () => {
        cy.intercept(
            'GET',
            '/api/forms/1/?fields=name,period_type,label_keys,id,org_unit_type_ids',
            {
                fixture: 'forms/detail.json',
            },
        );
        cy.intercept('GET', '/api/forms/1/?fields=possible_fields', {
            fixture: 'forms/possibleFields.json',
        });
        goToPage(
            superUser,
            {},
            listFixture,
            `${siteBaseUrl}/dashboard/forms/submissions/formIds/1/tab/list/mapResults/3000`,
        );
        cy.wait('@getSubmissions').then(() => {
            cy.get('#ColumnsSelectDrawer-toggleDrawer').click();
            cy.get('#ColumnsSelectDrawer-list')
                .as('selectColumnsList')
                .should('be.visible');
            cy.get('#ColumnsSelectDrawer-search').type('form');
            cy.get('@selectColumnsList').find('li').should('have.length', 2);
            cy.get('#ColumnsSelectDrawer-search-empty').click();
            cy.get('@selectColumnsList').find('li').should('have.length', 13);
            const testIsActive = (keyName, withUrl = true) => {
                cy.get('table').as('table');
                cy.get('@table').find('thead').find('th').as('thead');
                cy.get(`[data-test-column-switch="${keyName}"]`).should(
                    'be.checked',
                );
                cy.get('@thead').should('contain', keyName);
                if (withUrl) {
                    cy.url().should(url => {
                        expect(url.split('columns')[1]).to.contain(keyName);
                    });
                }
            };
            const tstIsInactiveActive = keyName => {
                cy.get('table').as('table');
                cy.get('@table').find('thead').find('th').as('thead');
                cy.get(`[data-test-column-switch="${keyName}"]`).should(
                    'not.be.checked',
                );
                cy.get('@thead').should('not.contain', keyName);
                cy.url().should(url => {
                    expect(url.split('columns')[1]).not.to.contain(keyName);
                });
            };
            possibleFields.possible_fields.forEach(pf => {
                cy.get(`[data-test-column-switch="${pf.name}"]`).as('switch');
                if (formDetail.label_keys.includes(pf.name)) {
                    testIsActive(pf.name, false);
                    cy.get(`@switch`).click();
                    tstIsInactiveActive(pf.name);
                } else {
                    tstIsInactiveActive(pf.name);
                    cy.get(`@switch`).click();
                    testIsActive(pf.name);
                }
                cy.get(`@switch`).parent().parent().should('be.visible');
            });

            cy.get('@selectColumnsList')
                .find('input[type="checkbox"]')
                .each($el => {
                    const keyName = $el.prop('data-test-column-switch');
                    if (
                        keyName &&
                        !possibleFields.possible_fields.includes(keyName)
                    ) {
                        cy.get(`[data-test-column-switch="${keyName}"]`).as(
                            'switch',
                        );
                        if ($el.prop('checked')) {
                            testIsActive(keyName);
                            cy.get(`@switch`).click();
                            tstIsInactiveActive(keyName);
                        } else {
                            tstIsInactiveActive(keyName);
                            cy.get(`@switch`).click();
                            testIsActive(keyName);
                        }
                    }
                });
        });
    });
});

describe('Map Tab', () => {
    it.skip('should display a map', () => {});
    it.skip('should different location', () => {});
    it.skip('should have working cluster', () => {});
});

describe('Files Tab', () => {
    it.skip('should display a files list', () => {});
    it.skip('should display a warning if no files', () => {});
    it.skip('should have a working pagination', () => {});
    it.skip('should split files types into tabs', () => {});
});
