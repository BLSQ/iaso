/// <reference types="cypress" />

import listFixture from '../../fixtures/projects/list.json';
import listfeatureFlags from '../../fixtures/featureflags/list.json';
import superUser from '../../fixtures/profiles/me/superuser.json';

const siteBaseUrl = Cypress.env('siteBaseUrl');

const baseUrl = `${siteBaseUrl}/dashboard/settings/projects`;

let interceptFlag = false;
const emptyFixture = 'projects/empty.json';
let table;
let row;
const defautlQuery = {
    limit: '20',
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
    cy.intercept('GET', '/api/featureflags', {
        fixture: 'featureflags/list.json',
    }).as('getFeatureFlags');
    const options = {
        method: 'GET',
        pathname: '/api/projects',
    };
    const query = {
        ...defautlQuery,
        ...formQuery,
    };
    cy.intercept({ ...options, query }, req => {
        req.continue(res => {
            interceptFlag = true;
            res.send({ fixture });
        });
    }).as('getProjects');
    cy.visit(baseUrl);
};

const openDialogForIndex = index => {
    table = cy.get('table');
    row = table.find('tbody').find('tr').eq(index);
    const actionCol = row.find('td').last();
    const editButton = actionCol.find('button');
    editButton.click();
    cy.get('#project-dialog').should('be.visible');
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
            errorCode.should('contain', '401');
        });
    });

    describe('Table', () => {
        it('should render results', () => {
            goToPage();
            cy.wait('@getProjects').then(() => {
                table = cy.get('table');
                table.should('have.length', 1);
                const rows = table.find('tbody').find('tr');
                rows.should('have.length', listFixture.projects.length);
                rows.eq(0).find('td').should('have.length', 4);
            });
        });

        it('should display correct amount of buttons on action column', () => {
            goToPage();
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
                cy.get('#add-button-container').find('button').click();
                cy.get('#project-dialog').should('be.visible');

                cy.testInputValue('#input-text-name', '');
                cy.testInputValue('#input-text-app_id', '');
            });
        });
        it('should display correct entity infos', () => {
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
        it('should call api list and api create', () => {
            goToPage();
            cy.wait('@getProjects').then(() => {
                const theIndex = 0;
                cy.get('#add-button-container').find('button').click();
                interceptFlag = false;
                const newProject = {
                    name: 'superman',
                    app_id: 'pacman',
                    feature_flags: [
                        listfeatureFlags.featureflags[2],
                        listfeatureFlags.featureflags[3],
                    ],
                };
                cy.get('#input-text-name').clear().type(newProject.name);
                cy.testInputValue('#input-text-name', newProject.name);
                cy.get('#input-text-app_id').clear().type(newProject.app_id);
                cy.testInputValue('#input-text-name', newProject.name);
                cy.selectTab(1, '#project-dialog');
                cy.fillMultiSelect('#feature_flags', [2, 3], false);
                cy.intercept(
                    {
                        method: 'POST',
                        pathname: '/api/apps/',
                    },
                    req => {
                        interceptFlag = true;
                        expect(req.body).to.deep.equal(newProject);
                        req.reply({
                            statusCode: 200,
                            body: listFixture.projects[theIndex],
                        });
                    },
                ).as('saveProject');

                let interceptFlagProjects = false;
                cy.intercept(
                    {
                        method: 'GET',
                        pathname: '/api/projects',
                        query: defautlQuery,
                    },
                    req => {
                        interceptFlagProjects = true;
                        req.reply({
                            statusCode: 200,
                            body: listFixture.projects[theIndex],
                        });
                    },
                ).as('getProjectsAfterCreate');
                cy.get('.MuiDialogActions-root').find('button').last().click();
                cy.wait('@saveProject').then(() => {
                    cy.wrap(interceptFlag).should('eq', true);
                });
                cy.wait('@getProjectsAfterCreate').then(() => {
                    cy.wrap(interceptFlagProjects).should('eq', true);
                });
            });
        });

        it('should call api list and api save', () => {
            goToPage();
            cy.wait('@getProjects').then(() => {
                const theIndex = 0;
                openDialogForIndex(theIndex);
                interceptFlag = false;
                const newProject = {
                    id: listFixture.projects[theIndex].app_id,
                    name: 'superman',
                    app_id: 'pacman',
                    feature_flags: [
                        listfeatureFlags.featureflags[2],
                        listfeatureFlags.featureflags[3],
                    ],
                    old_app_id: listFixture.projects[theIndex].app_id,
                };
                cy.get('#input-text-name').clear().type(newProject.name);
                cy.testInputValue('#input-text-name', newProject.name);
                cy.get('#input-text-app_id').clear().type(newProject.app_id);
                cy.testInputValue('#input-text-name', newProject.name);
                cy.selectTab(1, '#project-dialog');
                cy.fillMultiSelect('#feature_flags', [2, 3]);
                cy.intercept(
                    {
                        method: 'PUT',
                        pathname: `/api/apps/${listFixture.projects[theIndex].app_id}/`,
                    },
                    req => {
                        interceptFlag = true;
                        expect(req.body).to.deep.equal(newProject);
                        req.reply({
                            statusCode: 200,
                            body: listFixture.projects[theIndex],
                        });
                    },
                ).as('saveProject');

                let interceptFlagProjects = false;
                cy.intercept(
                    {
                        method: 'GET',
                        pathname: '/api/projects',
                        query: defautlQuery,
                    },
                    req => {
                        interceptFlagProjects = true;
                        req.reply({
                            statusCode: 200,
                            body: listFixture.projects[theIndex],
                        });
                    },
                ).as('getProjectsAfterSave');
                cy.get('.MuiDialogActions-root').find('button').last().click();
                cy.wait('@saveProject').then(() => {
                    cy.wrap(interceptFlag).should('eq', true);
                });
                cy.wait('@getProjectsAfterSave').then(() => {
                    cy.wrap(interceptFlagProjects).should('eq', true);
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
