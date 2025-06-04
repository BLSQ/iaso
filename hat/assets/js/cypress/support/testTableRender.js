import { makePaginatedResponse } from './dummyData';

// Won't work if table is combined with a search feature

// TODO wrap in describe
export const testTablerender = ({
    baseUrl,
    rows,
    columns,
    apiKey,
    responseKey,
    withVisit = true,
    selector = 'table',
    request,
    apiPath,
}) =>
    describe('When table renders', () => {
        it('Displays Table with right amount of rows and columns', () => {
            if (withVisit) {
                cy.visit(baseUrl);
            }

            if (request) {
                cy.wait(request).then(() => {
                    cy.get(selector).as('table');
                    cy.get('@table').should('have.length', 1);
                    cy.get('@table').find('tbody').find('tr').as('tableRows');
                    cy.get('@tableRows').should('have.length', rows);
                    // number of col
                    cy.get('@tableRows')
                        .eq(0)
                        .find('td')
                        .should('have.length', columns);
                });
            } else {
                cy.get(selector).as('table');
                cy.get('@table').should('have.length', 1);
                cy.get('@table').find('tbody').find('tr').as('tableRows');
                cy.get('@tableRows').should('have.length', rows);
                // number of col
                cy.get('@tableRows')
                    .eq(0)
                    .find('td')
                    .should('have.length', columns);
            }
        });
        it("Displays an empty table when there's no data", () => {
            cy.intercept(
                'GET',
                apiPath ? `/api/${apiPath}` : `/api/${apiKey}/*`,
                {
                    statusCode: 200,
                    body: makePaginatedResponse({
                        dataKey: responseKey ?? apiKey,
                    }),
                },
            ).as('fetch');
            cy.visit(baseUrl);
            cy.wait('@fetch', { timeout: 10000 });

            cy.get(selector).as('table');
            cy.get('@table').should('have.length', 1);
            cy.get('@table').find('tbody').find('tr').should('not.exist');
        });
    });
