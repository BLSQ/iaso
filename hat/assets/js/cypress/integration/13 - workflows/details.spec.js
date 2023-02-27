/// <reference types="cypress" />

import superUser from '../../fixtures/profiles/me/superuser.json';
import details from '../../fixtures/workflows/details.json';

const siteBaseUrl = Cypress.env('siteBaseUrl');
const baseUrl = `${siteBaseUrl}/dashboard/workflows/details/entityTypeId/3/versionId/12`;

let interceptFlag = false;
const mockPage = () => {
    cy.login();
    cy.intercept('GET', '/sockjs-node/**');
    cy.intercept('GET', '/api/profiles/me/**', {
        fixture: 'profiles/me/superuser.json',
    });
    cy.intercept('GET', '/api/workflowversions/12/', {
        fixture: 'workflows/details.json',
    }).as('getDetails');
    cy.intercept('GET', '/api/forms/7/?fields=possible_fields', {
        fixture: 'workflows/possible_fields.json',
    }).as('getPossibleFields');
    cy.intercept('GET', '/api/formversions/?form_id=7&fields=descriptor', {
        fixture: 'workflows/descriptor.json',
    }).as('getDescriptor');

    cy.intercept('GET', '/api/forms/?fields=id,name', {
        fixture: 'forms/list.json',
    });
};
const name = 'mario';

describe('Workflows details', () => {
    it('page should not be accessible if user does not have permission', () => {
        const fakeUser = {
            ...superUser,
            permissions: [],
            is_superuser: false,
        };
        mockPage();
        cy.intercept('GET', '/api/profiles/me/**', fakeUser);
        cy.visit(baseUrl);
        const errorCode = cy.get('#error-code');
        errorCode.should('contain', '401');
    });
    describe('with any status', () => {
        beforeEach(() => {
            mockPage();
            cy.visit(baseUrl);
        });
        it('should display correct infos values', () => {
            cy.get('[data-test="workflow-base-info"]')
                .as('tableInfos')
                .should('be.visible');
            cy.get('@tableInfos')
                .find('tr')
                .eq(0)
                .find('td')
                .eq(1)
                .should('contain', details.entity_type.name);
            cy.get('@tableInfos')
                .find('tr')
                .eq(1)
                .find('td')
                .eq(1)
                .should('contain', details.reference_form.name);
            cy.get('@tableInfos')
                .find('tr')
                .eq(2)
                .find('td')
                .eq(1)
                .should('contain', details.version_id);
            cy.get('@tableInfos')
                .find('tr')
                .eq(3)
                .find('td')
                .eq(1)
                .should('contain', 'Draft');
        });
        it('should be possible to edit and save name', () => {
            cy.get('[data-test="save-name-button"]').as('saveButton');
            cy.get('@saveButton')
                .invoke('attr', 'disabled')
                .should('equal', 'disabled');

            cy.fillTextField('#input-text-name', name);
            cy.get('@saveButton')
                .invoke('attr', 'disabled')
                .should('equal', undefined);

            interceptFlag = false;

            cy.intercept(
                {
                    method: 'PATCH',
                    pathname: '/api/workflowversions/12',
                },
                req => {
                    interceptFlag = true;
                    req.reply({
                        statusCode: 200,
                        body: {},
                    });
                },
            ).as('saveVersion');

            cy.get('@saveButton').click();
            cy.wait('@saveVersion').then(xhr => {
                cy.wrap(xhr.request.body).its('name').should('eq', name);
                cy.wrap(interceptFlag).should('eq', true);
            });
        });
        it('should display correct follow-ups', () => {
            cy.get('[data-test="follow-ups"]')
                .find('table')
                .as('followUpTable');
            cy.get('@followUpTable').should('be.visible');
            cy.get('@followUpTable')
                .find('tbody')
                .find('tr')
                .should('have.length', 2);

            cy.get('@followUpTable')
                .find('tbody')
                .find('tr')
                .eq(0)
                .as('firstRow');

            cy.get('@followUpTable')
                .find('tbody')
                .find('tr')
                .eq(1)
                .as('secondRow');
            cy.get('@firstRow')
                .find('td')
                .eq(1)
                .should('contain', 'Gender = Male AND Entity Group = Group A');
            cy.get('@firstRow').find('td').eq(2).should('contain', 'FORM_3');
            cy.get('@firstRow')
                .find('td')
                .eq(3)
                .should('contain', '31/01/2023');
            cy.get('@firstRow')
                .find('td')
                .eq(4)
                .should('contain', '13/02/2023');

            cy.get('@secondRow')
                .find('td')
                .eq(1)
                .should('contain', 'Last name = last_name_value');
            cy.get('@secondRow').find('td').eq(2).should('contain', 'FORM_2');
            cy.get('@secondRow')
                .find('td')
                .eq(3)
                .should('contain', '01/02/2023');
            cy.get('@secondRow')
                .find('td')
                .eq(4)
                .should('contain', '01/02/2023');
        });
        it('should display correct changes', () => {
            cy.get('[data-test="changes"]').find('table').as('changesTable');
            cy.get('@changesTable').should('be.visible');
            cy.get('@changesTable')
                .find('tbody')
                .find('tr')
                .should('have.length', 2);

            cy.get('@changesTable')
                .find('tbody')
                .find('tr')
                .eq(0)
                .as('firstRow');
            cy.get('@changesTable')
                .find('tbody')
                .find('tr')
                .eq(1)
                .as('secondRow');

            cy.get('@firstRow').find('td').eq(0).should('contain', 'FORM_2');
            cy.get('@firstRow')
                .find('td')
                .eq(1)
                .should(
                    'contain',
                    'first_name => firstName, last_name => LastName',
                );
            cy.get('@firstRow')
                .find('td')
                .eq(2)
                .should('contain', '31/01/2023');
            cy.get('@firstRow')
                .find('td')
                .eq(3)
                .should('contain', '31/01/2023');

            cy.get('@secondRow').find('td').eq(0).should('contain', 'FORM_3');
            cy.get('@secondRow')
                .find('td')
                .eq(1)
                .should('contain', 'last_name => name');
            cy.get('@secondRow')
                .find('td')
                .eq(2)
                .should('contain', '31/01/2023');
            cy.get('@secondRow')
                .find('td')
                .eq(3)
                .should('contain', '31/01/2023');
        });
    });
    describe('with DRAFT status', () => {
        beforeEach(() => {
            mockPage();
            cy.visit(baseUrl);
        });
        it('should be possible to publish', () => {
            interceptFlag = false;
            cy.intercept(
                {
                    method: 'PATCH',
                    pathname: '/api/workflowversions/12/',
                },
                req => {
                    interceptFlag = true;
                    req.reply({
                        statusCode: 200,
                        body: {},
                    });
                },
            ).as('publishVersion');
            cy.get('[data-test="publish-workflow-button"')
                .should('be.visible')
                .click();
            cy.get('[data-test="publish-workflow-version"]').should(
                'be.visible',
            );
            cy.get('[data-test="confirm-button"]').click();
            cy.wait('@publishVersion').then(xhr => {
                cy.wrap(xhr.request.body)
                    .its('status')
                    .should('eq', 'PUBLISHED');
                cy.wrap(interceptFlag).should('eq', true);
            });
        });

        it.only('should create a follow-up', () => {
            interceptFlag = false;
            cy.intercept(
                {
                    method: 'POST',
                    pathname: '/api/workflowfollowups/',
                    query: {
                        version_id: '12',
                    },
                },
                req => {
                    interceptFlag = true;
                    req.reply({
                        statusCode: 200,
                        body: {},
                    });
                },
            ).as('addFollowUp');

            cy.wait([
                '@getDetails',
                '@getDescriptor',
                '@getPossibleFields',
            ]).then(() => {
                cy.get('[data-test="create-follow-ups"')
                    .should('be.visible')
                    .click();
                cy.get('[data-test="follow-up-modal"').should('be.visible');
                cy.get('[data-test="confirm-button"]').as('saveButton');
                cy.get('@saveButton')
                    .invoke('attr', 'disabled')
                    .should('equal', 'disabled');
                cy.testInputValue('#forms', '');
                cy.get('.query-builder button').eq(0).click();
                cy.get('.query-builder .MuiInputBase-input').click();
                cy.get('[role="option"]').eq(0).click();
                cy.get('.widget--widget input[type="text"]').type(name);
                cy.fillSingleSelect('#forms', 0);

                cy.get('@saveButton')
                    .invoke('attr', 'disabled')
                    .should('equal', undefined);
                cy.get('@saveButton').click();
                cy.wait('@addFollowUp').then(xhr => {
                    cy.wrap(xhr.request.body).its('order').should('eq', 2);
                    cy.wrap(xhr.request.body.condition.and[0]['=='][0])
                        .its('var')
                        .should('eq', 'first_name');
                    cy.wrap(xhr.request.body.condition.and[0]['=='][1]).should(
                        'eq',
                        name,
                    );
                    cy.wrap(xhr.request.body.form_ids[0]).should('eq', 1);
                    cy.wrap(interceptFlag).should('eq', true);
                });
            });
        });
        it.only('should edit a follow-up', () => {
            // TO-DO: test query builder properly, point here is to test edit feature
            interceptFlag = false;
            cy.intercept(
                {
                    method: 'POST',
                    pathname: '/api/workflowfollowups/bulkupdate/',
                },
                req => {
                    interceptFlag = true;
                    req.reply({
                        statusCode: 200,
                        body: {},
                    });
                },
            ).as('editFollowUp');

            cy.wait([
                '@getDetails',
                '@getDescriptor',
                '@getPossibleFields',
            ]).then(() => {
                cy.get('[data-test="follow-ups"]')
                    .find('table tbody tr')
                    .eq(0)
                    .find('td')
                    .last()
                    .find('button')
                    .first()
                    .click();
                cy.get('[data-test="follow-up-modal"').should('be.visible');
                cy.get('[data-test="confirm-button"]').as('saveButton');
                cy.testMultiSelect('#forms', [{ name: 'FORM 1' }]);
                cy.get('.query-builder button').eq(0).click();
                cy.get('.query-builder .MuiInputBase-input').eq(0).click();
                cy.get('[role="option"]').eq(2).click();
                cy.get('.widget--widget input[type="text"]')
                    .type('{selectall}')
                    .type(name);
                cy.fillSingleSelect('#forms', 0);

                cy.get('@saveButton')
                    .invoke('attr', 'disabled')
                    .should('equal', undefined);
                cy.get('@saveButton').click();
                cy.wait('@editFollowUp').then(xhr => {
                    cy.wrap(xhr.request.body[0]).its('order').should('eq', 0);
                    cy.wrap(xhr.request.body[0].condition['!'].and[0]['=='][0])
                        .its('var')
                        .should('eq', 'last_name');
                    cy.wrap(
                        xhr.request.body[0].condition['!'].and[0]['=='][1],
                    ).should('eq', name);
                    cy.wrap(xhr.request.body[0].form_ids[0]).should('eq', 2);
                    cy.wrap(xhr.request.body[0].form_ids[1]).should('eq', 1);
                    cy.wrap(interceptFlag).should('eq', true);
                });
            });
        });
        it.skip('should delete a follow-up', () => {});
        it.skip('should change order of follow-ups and save it', () => {});
        it.skip('should reset order of follow-ups', () => {});

        it.skip('should create a change', () => {});
        it.skip('should edit a change', () => {});
        it.skip('should delete a change', () => {});

        describe('follow-up modal', () => {
            it.skip('should display correct infos', () => {});
            it.skip('should not save if form is not set', () => {});
            it.skip('should set condition to true if empty', () => {});
            it.skip('should save correctly', () => {});
        });
        describe('changes modal', () => {
            it.skip('should display correct infos ', () => {});
            it.skip('should match fields type', () => {});
            it.skip('should not save if a mapping is empty', () => {});
            it.skip('should not have mapping on the same field', () => {});
            it.skip('should not save if form is empty', () => {});
            it.skip('should save correctly', () => {});
        });
    });
    describe('with PUBLISHED status', () => {
        it.skip('should not be possible to publish', () => {});
        it.skip('should not create edit or delete a follow-up', () => {});
        it.skip('should not change order of follow-ups and save it', () => {});
        it.skip('should not create edit or delete a change', () => {});
    });
    describe('with UNPUBLISHED status', () => {
        it.skip('should not be possible to publish', () => {});
        it.skip('should not create edit or delete a follow-up', () => {});
        it.skip('should not change order of follow-ups and save it', () => {});
        it.skip('should not create edit or delete a change', () => {});
    });
});
