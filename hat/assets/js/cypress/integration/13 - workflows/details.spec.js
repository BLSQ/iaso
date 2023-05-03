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
    }).as('getProfile');
    cy.intercept('GET', '/api/workflowversions/12/', {
        fixture: 'workflows/details.json',
    }).as('getDetails');
    cy.intercept(
        'GET',
        '/api/workflowchanges/?order=updated_at&version_id=12',
        {
            fixture: 'workflows/changes.json',
        },
    ).as('getChanges');
    cy.intercept(
        'GET',
        'api/formversions/?form_id=7&fields=version_id,possible_fields,created_at',
        {
            fixture: 'workflows/possible_fields.json',
        },
    ).as('getPossibleFields');
    cy.intercept('GET', '/api/formversions/?form_id=7&fields=descriptor', {
        fixture: 'workflows/descriptor.json',
    }).as('getDescriptor');

    cy.intercept('GET', '/api/forms/?fields=id,name', {
        fixture: 'forms/list.json',
    }).as('getForms');
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
    it('with PUBLISHED or UNPUBLISHED status should not be able to publish; create, delete, change order or edit follow-ups and create, edit, delete changes', () => {
        const testStatus = status => {
            mockPage();
            const fixture = {
                ...details,
                status,
            };
            cy.intercept(
                {
                    pathname: '/api/workflowversions/12/',
                    method: 'GET',
                },
                fixture,
            ).as('getDetails');
            cy.visit(baseUrl);

            cy.wait([
                '@getDetails',
                '@getChanges',
                '@getDescriptor',
                '@getPossibleFields',
            ]).then(() => {
                cy.log('Publish');
                cy.get('[data-test="publish-workflow-button"]').should(
                    'not.exist',
                );
                cy.log('Create follow-up');
                cy.get('[data-test="create-follow-ups"]').should('not.exist');

                cy.log('Edit and delete follow-up');
                cy.get('[data-test="follow-ups"]')
                    .find('table tbody tr')
                    .eq(0)
                    .find('td')
                    .last()
                    .find('button')
                    .should('not.exist');

                cy.log('Change order');
                cy.get('[data-test="follow-ups"]')
                    .find('table tbody tr')
                    .eq(0)
                    .find('td')
                    .eq(0)
                    .should('contain', '1');
                cy.get('[data-test="reset-follow-up-order"]').should(
                    'not.exist',
                );
                cy.get('[data-test="save-follow-up-order"]').should(
                    'not.exist',
                );

                cy.log('Create change');
                cy.get('[data-test="create-change"]').should('not.exist');

                cy.log('Edit and delete change');
                cy.get('[data-test="changes"]')
                    .find('table tbody tr')
                    .eq(0)
                    .find('td')
                    .last()
                    .find('button')
                    .should('not.exist');
            });
        };
        testStatus('PUBLISHED');
        testStatus('UNPUBLISHED');
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
                .should('contain', 'Last name = last_name_value');
            cy.get('@firstRow').find('td').eq(2).should('contain', 'FORM_2');
            cy.get('@firstRow')
                .find('td')
                .eq(3)
                .should('contain', '01/02/2023');
            cy.get('@firstRow')
                .find('td')
                .eq(4)
                .should('contain', '01/02/2023');

            cy.get('@secondRow')
                .find('td')
                .eq(1)
                .should('contain', 'Gender = Male AND Entity Group = Group A');
            cy.get('@secondRow').find('td').eq(2).should('contain', 'FORM_3');
            cy.get('@secondRow')
                .find('td')
                .eq(3)
                .should('contain', '31/01/2023');
            cy.get('@secondRow')
                .find('td')
                .eq(4)
                .should('contain', '13/02/2023');
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
                    'firstName => first_name, LastName => last_name',
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
                .should('contain', 'name => last_name');
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
        it('should create a follow-up', () => {
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
                '@getChanges',
                '@getDescriptor',
                '@getPossibleFields',
            ]).then(() => {
                cy.get('[data-test="create-follow-ups"')
                    .should('be.visible')
                    .click();
                cy.get('[data-test="follow-up-modal"]').should('be.visible');
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
        it('should edit a follow-up', () => {
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
                '@getChanges',
                '@getDescriptor',
                '@getPossibleFields',
                '@getProfile',
            ]).then(() => {
                cy.wait(500);
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
        it('should delete a follow-up', () => {
            interceptFlag = false;
            cy.intercept(
                {
                    method: 'delete',
                    pathname: '/api/workflowfollowups/1/',
                },
                req => {
                    interceptFlag = true;
                    req.reply({
                        statusCode: 200,
                        body: {},
                    });
                },
            ).as('deleteFollowUp');

            cy.wait(['@getDetails', '@getChanges']).then(() => {
                cy.get('[data-test="follow-ups"]')
                    .find('table tbody tr')
                    .eq(0)
                    .find('td')
                    .last()
                    .find('button')
                    .last()
                    .click();

                cy.get(
                    '[data-test="delete-dialog-delete-workflow-follow-up-1"]',
                ).should('be.visible');
                cy.get('[data-test="confirm-button"]').click();
                cy.wait('@deleteFollowUp').then(() => {
                    cy.wrap(interceptFlag).should('eq', true);
                });
            });
        });
        it('should create a change', () => {
            interceptFlag = false;
            cy.intercept(
                {
                    method: 'POST',
                    pathname: '/api/workflowchanges/',
                },
                req => {
                    interceptFlag = true;
                    req.reply({
                        statusCode: 200,
                        body: {},
                    });
                },
            ).as('addChange');

            cy.wait([
                '@getDetails',
                '@getChanges',
                '@getDescriptor',
                '@getPossibleFields',
            ]).then(() => {
                cy.intercept(
                    'GET',
                    'api/formversions/?form_id=1&fields=version_id,possible_fields,created_at',
                    {
                        fixture: 'workflows/possible_fields.json',
                    },
                );
                cy.get('[data-test="create-change"]').click();
                cy.get('[data-test="change-modal"]').should('be.visible');
                cy.get('[data-test="confirm-button"]').as('saveButton');
                cy.get('@saveButton')
                    .invoke('attr', 'disabled')
                    .should('equal', 'disabled');
                cy.testInputValue('#forms', '');
                cy.fillSingleSelect('#forms', 0);
                cy.get('[data-test="change-modal"]')
                    .find('table tbody tr')
                    .should('have.length', 0);
                cy.get('[data-test="create-change-button"]').click();
                cy.get('[data-test="change-modal"]')
                    .find('table tbody tr')
                    .should('have.length', 1);

                cy.get('[data-test="change-modal"]')
                    .find('table tbody tr td')
                    .eq(0)
                    .find('#source')
                    .click();
                cy.get('#source-option-1').click();
                cy.get('[data-test="change-modal"]')
                    .find('table tbody tr td')
                    .eq(1)
                    .find('#target')
                    .click();
                cy.get('#target-option-1').click();

                cy.get('@saveButton')
                    .invoke('attr', 'disabled')
                    .should('equal', undefined);
                cy.get('@saveButton').click();
                cy.wait('@addChange').then(xhr => {
                    // {"form":67,"mapping":{"registration_id":"nom"}}
                    cy.wrap(xhr.request.body).its('form').should('eq', 1);
                    cy.wrap(xhr.request.body.mapping)
                        .its('middle_names')
                        .should('eq', 'middle_names');
                    cy.wrap(interceptFlag).should('eq', true);
                });
            });
        });
        it('should edit a change', () => {
            interceptFlag = false;
            cy.intercept(
                {
                    method: 'PUT',
                    pathname: '/api/workflowchanges/1/',
                },
                req => {
                    interceptFlag = true;
                    req.reply({
                        statusCode: 200,
                        body: {},
                    });
                },
            ).as('editChange');

            cy.wait([
                '@getDetails',
                '@getChanges',
                '@getDescriptor',
                '@getPossibleFields',
                '@getProfile',
            ]).then(() => {
                cy.intercept(
                    'GET',
                    'api/formversions/?form_id=2&fields=version_id,possible_fields,created_at',
                    {
                        fixture: 'workflows/possible_fields_source.json',
                    },
                );

                cy.intercept('GET', '/api/forms/?fields=id,name', {
                    fixture: 'forms/list.json',
                });
                cy.get('[data-test="changes"]')
                    .find('table tbody tr')
                    .eq(0)
                    .find('td')
                    .last()
                    .find('button')
                    .first()
                    .click();
                cy.get('[data-test="change-modal"').should('be.visible');

                cy.get('[data-test="confirm-button"]').as('saveButton');

                cy.testInputValue('#forms', 'FORM 1');

                cy.intercept(
                    'GET',
                    'api/formversions/?form_id=4&fields=version_id,possible_fields,created_at',
                    {
                        fixture: 'workflows/possible_fields_source.json',
                    },
                ).as('getSourcePossibleFields');

                cy.log('Should display correct infos');

                cy.log('on first row');
                cy.get('[data-test="change-modal"]')
                    .find('table tbody tr')
                    .eq(0)
                    .find('td')
                    .eq(0)
                    .find('#source')
                    .invoke('attr', 'value')
                    .should('contain', 'First name');

                cy.get('[data-test="change-modal"]')
                    .find('table tbody tr')
                    .eq(1)
                    .find('td')
                    .eq(0)
                    .find('#source')
                    .invoke('attr', 'value')
                    .should('contain', 'Last name');
                cy.log('on second row');
                cy.get('[data-test="change-modal"]')
                    .find('table tbody tr')
                    .eq(0)
                    .find('td')
                    .eq(1)
                    .find('#target')
                    .invoke('attr', 'value')
                    .should('contain', 'First name');

                cy.get('[data-test="change-modal"]')
                    .find('table tbody tr')
                    .eq(1)
                    .find('td')
                    .eq(1)
                    .find('#target')
                    .invoke('attr', 'value')
                    .should('contain', 'Last name');

                cy.log('Sources should be empty by changing source form');
                cy.fillSingleSelect('#forms', 2);
                cy.get('@saveButton')
                    .invoke('attr', 'disabled')
                    .should('equal', 'disabled');
                cy.wait('@getSourcePossibleFields').then(() => {
                    cy.wait(200);
                    cy.get('[data-test="change-modal"]')
                        .find('table tbody tr')
                        .eq(0)
                        .find('td')
                        .eq(0)
                        .find('#source')
                        .as('source')
                        .invoke('attr', 'value')
                        .should('eq', '');
                    cy.get('@source').click();
                    cy.get('#source-option-1').click();

                    cy.get('[data-test="change-modal"]')
                        .find('table tbody tr')
                        .eq(1)
                        .find('td')
                        .eq(0)
                        .find('#source')
                        .as('source')
                        .invoke('attr', 'value')
                        .should('eq', '');
                    cy.get('@source').click();
                    cy.log(
                        'Selected source should not be present in options list',
                    );
                    cy.get('#source-popup').should('not.contain', 'Last name');
                    cy.get('#source-option-1').click();

                    cy.log("Save should be disabled if type does'nt match");
                    cy.get('@saveButton')
                        .invoke('attr', 'disabled')
                        .should('equal', 'disabled');

                    cy.get('[data-test="change-modal"]')
                        .find('table tbody tr')
                        .eq(1)
                        .find('td')
                        .eq(1)
                        .find('#target')
                        .as('target')
                        .invoke('attr', 'value')
                        .should('eq', '');
                    cy.get('@target').click();
                    cy.get('#target-popup').should('not.contain', 'Type: text');
                    cy.get('#target-option-0').click();
                    cy.get('@saveButton')
                        .invoke('attr', 'disabled')
                        .should('equal', undefined);

                    cy.get('@saveButton').click();
                    cy.wait('@editChange').then(xhr => {
                        cy.wrap(xhr.request.body).its('form').should('eq', 4);
                        cy.wrap(xhr.request.body.mapping)
                            .its('LastName')
                            .should('eq', 'first_name');
                        cy.wrap(xhr.request.body.mapping)
                            .its('Age')
                            .should('eq', 'age');
                        cy.wrap(interceptFlag).should('eq', true);
                    });
                });
            });
        });
        it('should delete a change', () => {
            interceptFlag = false;
            cy.intercept(
                {
                    method: 'delete',
                    pathname: '/api/workflowchanges/1/',
                },
                req => {
                    interceptFlag = true;
                    req.reply({
                        statusCode: 200,
                        body: {},
                    });
                },
            ).as('deleteChange');

            cy.wait([
                '@getDetails',
                '@getChanges',
                '@getDescriptor',
                '@getPossibleFields',
            ]).then(() => {
                cy.intercept(
                    'GET',
                    'api/formversions/?form_id=7&fields=version_id,possible_fields,created_at',
                    {
                        fixture: 'workflows/possible_fields_source.json',
                    },
                );
                cy.wait(100);
                cy.get('[data-test="changes"]')
                    .find('table tbody tr')
                    .eq(0)
                    .find('td')
                    .last()
                    .find('button')
                    .last()
                    .click();

                cy.get(
                    '[data-test="delete-dialog-delete-workflow-change-1"]',
                ).should('be.visible');
                cy.get('[data-test="confirm-button"]').click();
                cy.wait('@deleteChange').then(() => {
                    cy.wrap(interceptFlag).should('eq', true);
                });
            });
        });

        // TO-DO: implement drag & drop behaviour  with cypress => https://github.com/clauderic/dnd-kit/blob/master/cypress/support/commands.ts
        it.skip('should change order of follow-ups and save it', () => {});
        it.skip('should reset order of follow-ups', () => {});
    });
});
