/// <reference types="cypress" />

import listfeatureFlags from '../../fixtures/featureflags/list.json';
import superUser from '../../fixtures/profiles/me/superuser.json';
import listFixture from '../../fixtures/projects/list.json';
import page2 from '../../fixtures/projects/list_page2.json';

import { testPagination } from '../../support/testPagination';
import { testTablerender } from '../../support/testTableRender';

const siteBaseUrl = Cypress.env('siteBaseUrl');
let interceptFlagProjects = false;

const baseUrl = `${siteBaseUrl}/dashboard/settings/projects`;

let interceptFlag = false;
const emptyFixture = 'projects/empty.json';
let table;
let row;
const defaultQuery = {
    limit: '10',
    order: 'id',
    page: '1',
};
const goToPage = (
    fakeUser = superUser,
    formQuery,
    fixture = 'projects/list.json',
) => {
    cy.login();
    interceptFlag = false;
    cy.intercept('GET', '/sockjs-node/**');
    cy.intercept('GET', '/api/profiles/me/**', fakeUser);
    cy.intercept('GET', '/api/featureflags/except_no_activated_modules/', {
        fixture: 'featureflags/list.json',
    }).as('getFeatureFlags');
    const options = {
        method: 'GET',
        pathname: '/api/projects',
    };
    const query = {
        ...defaultQuery,
        ...formQuery,
    };
    cy.intercept({ ...options, query }, req => {
        req.on('response', response => {
            if (response.statusMessage === 'OK') {
                interceptFlag = true;
                response.send({ fixture });
            }
        });
    }).as('getProjects');
    cy.visit(baseUrl);
};

const openDialogForIndex = index => {
    table = cy.get('table');
    cy.intercept('GET', '/api/projects/1/qr_code/', {
        statusCode: 200,
        body: 'mock-qr-code-data',
    }).as('getQRCode');
    row = table.find('tbody').find('tr').eq(index);
    const actionCol = row.find('td').last();
    const editButton = actionCol.find('button');
    editButton.click();
    cy.get('#project-dialog').should('be.visible');
};

const testRowContent = (index, p = listFixture.projects[index]) => {
    cy.get('table').as('table');
    cy.get('@table').find('tbody').find('tr').eq(index).as('row');
    cy.get('@row').find('td').eq(0).should('contain', p.name);
    cy.get('@row').find('td').eq(1).should('contain', p.app_id);
    cy.get('@row').find('td').eq(2).as('ffCol');
    p.feature_flags.forEach(ff => {
        cy.get('@ffCol').should('contain', ff.name);
    });
};

const testDialogContent = p => {
    cy.get('#input-text-name').clear();
    cy.get('#input-text-name').type(p.name);
    cy.get('#input-text-app_id').clear();
    cy.get('#input-text-app_id').type(p.app_id);
    cy.selectTab(1, '#project-dialog');
    cy.get('[data-test="featureFlag-toggle"]').each($toggle => {
        cy.wrap($toggle).click();
    });
    cy.get('[data-test="featureFlag-checkbox"] input').each($el => {
        cy.wrap($el).then(el => {
            const { name } = el[0];
            if (
                p.feature_flags
                    .map(featureflag => featureflag.id)
                    .includes(name)
            ) {
                el.should('be.checked');
            }
        });
    });
};

const mockListCall = (keyName, body) => {
    interceptFlagProjects = false;
    cy.intercept(
        {
            method: 'GET',
            pathname: '/api/projects',
            query: defaultQuery,
        },
        req => {
            interceptFlagProjects = true;
            req.reply({
                statusCode: 200,
                body,
            });
        },
    ).as(keyName);
};
const mockSaveCall = (method, i, pathname, p) => {
    interceptFlag = false;
    cy.intercept(
        {
            method,
            pathname,
        },
        req => {
            interceptFlag = true;
            expect(req.body).to.deep.equal(p);
            req.reply({
                statusCode: 200,
                body: listFixture.projects[i],
            });
        },
    ).as('saveProject');
};

describe('Projects', () => {
    describe('Page', () => {
        it('should not be accessible if user does not have permission', () => {
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
                '/api/projects/?limit=10&order=id&page=2',
                page2,
            );
        });
        testTablerender({
            baseUrl,
            rows: listFixture.projects.length,
            columns: 4,
            apiKey: 'projects',
        });
        testPagination({
            baseUrl,
            apiPath: '/api/projects/**',
            apiKey: 'projects',
            withSearch: false,
            fixture: listFixture,
        });
        it('should render correct row infos', () => {
            cy.wait('@getProjects').then(() => {
                testRowContent(0);
            });
        });

        it('should display correct amount of buttons on action column', () => {
            cy.wait('@getProjects').then(() => {
                table = cy.get('table');
                row = table.find('tbody').find('tr').eq(1);
                const actionCol = row.find('td').last();
                actionCol.find('button').should('have.length', 1);
            });
        });
    });

    describe('Dialog', () => {
        it('should display empty project dialog', () => {
            // this will be tested when creation will be enabled
            goToPage();
            cy.wait('@getProjects').then(() => {
                cy.get('[data-test="add-project-button"]').click();
                cy.get('#project-dialog').should('be.visible');

                cy.testInputValue('#input-text-name', '');
                cy.testInputValue('#input-text-app_id', '');
            });
        });
        it('should display correct project infos', () => {
            goToPage();
            cy.wait('@getProjects').then(() => {
                const theIndex = 0;
                openDialogForIndex(theIndex);

                cy.testInputValue(
                    '#input-text-name',
                    listFixture.projects[theIndex].name,
                );
                cy.testInputValue(
                    '#input-text-app_id',
                    listFixture.projects[theIndex].app_id,
                );
            });
        });

        // TODO: rewrite tests using table UX
        it('should save correctly', () => {
            goToPage();
            cy.wait('@getProjects').then(() => {
                const theIndex = 0;
                openDialogForIndex(theIndex);
                const newProject = {
                    id: listFixture.projects[theIndex].app_id,
                    feature_flags: [
                        listfeatureFlags.featureflags[2],
                        listfeatureFlags.featureflags[3],
                    ],
                    app_id: 'pacman',
                    name: 'superman',
                    old_app_id: listFixture.projects[theIndex].app_id,
                    color: '#1976D2',
                };
                const newProjects = [...listFixture.projects];
                newProjects[theIndex] = {
                    ...listFixture.projects[theIndex],
                    ...newProject,
                };
                const newList = {
                    ...listFixture,
                    projects: newProjects,
                };

                testDialogContent(newProject);
                listFixture.projects[theIndex].feature_flags.forEach(
                    featureFlag => {
                        cy.get(
                            `[data-test="featureFlag-checkbox"] input[name="${featureFlag.code}"]`,
                        ).uncheck();
                    },
                );

                newProject.feature_flags.forEach(featureFlag => {
                    cy.get(
                        `[data-test="featureFlag-checkbox"] input[name="${featureFlag.code}"]`,
                    ).check();
                });

                mockSaveCall(
                    'PUT',
                    theIndex,
                    `/api/apps/${listFixture.projects[theIndex].app_id}/`,
                    newProject,
                );

                mockListCall('getProjectsAfterSave', newList);

                cy.get('.MuiDialogActions-root').find('button').last().click();
                cy.wait('@saveProject').then(() => {
                    cy.wrap(interceptFlag).should('eq', true);
                    cy.wait('@getProjectsAfterSave').then(() => {
                        cy.wrap(interceptFlagProjects).should('eq', true);
                        testRowContent(0, newProject);
                    });
                });
            });
        });

        // TODO: rewrite tests using table UX
        it('should create correctly', () => {
            goToPage();
            cy.wait('@getProjects').then(() => {
                const theIndex = 0;
                cy.get('[data-test="add-project-button"]').click();
                const newProject = {
                    name: 'create',
                    app_id: 'project',
                    feature_flags: [
                        listfeatureFlags.featureflags[0],
                        listfeatureFlags.featureflags[1],
                    ],
                    color: '#1976D2',
                };
                const newList = {
                    ...listFixture,
                };
                newList.projects.unshift(newProject);

                testDialogContent(newProject);
                newProject.feature_flags.forEach(featureFlag => {
                    cy.get(
                        `[data-test="featureFlag-checkbox"] input[name="${featureFlag.code}"]`,
                    ).check();
                });

                mockSaveCall('POST', theIndex, '/api/apps/', newProject);
                mockListCall('getProjectsAfterCreate', newList);

                cy.get('.MuiDialogActions-root').find('button').last().click();
                cy.wait('@saveProject').then(() => {
                    cy.wrap(interceptFlag).should('eq', true);
                    cy.wait('@getProjectsAfterCreate').then(() => {
                        cy.wrap(interceptFlagProjects).should('eq', true);
                        testRowContent(0, newProject);
                    });
                });
            });
        });
    });

    describe('Api', () => {
        it('should be called with base params', () => {
            goToPage(superUser, {}, emptyFixture);
            cy.wait('@getProjects').then(() => {
                cy.wrap(interceptFlag).should('eq', true);
            });
        });
    });
});
