// Won't work if table is combined with a search feature

import { makePaginatedResponse } from './dummyData';

// TODO wrap in describe
export const testTablerender = ({
    baseUrl,
    rows,
    columns,
    apiKey,
    responseKey,
    withVisit = true,
}) =>
    describe('When table renders', () => {
        it('Displays Table with right amount of rows and columns', () => {
            if (withVisit) {
                cy.visit(baseUrl);
            }
            const table = cy.get('table');
            table.should('have.length', 1);
            const tableRows = table.find('tbody').find('tr');
            tableRows.should('have.length', rows);
            // number of col
            tableRows.eq(0).find('td').should('have.length', columns);
        });
        it("Displays an empty table when there's no data", () => {
            cy.intercept('GET', `/api/${apiKey}/*`, {
                statusCode: 200,
                body: makePaginatedResponse({ dataKey: responseKey ?? apiKey }),
            }).as('fetch');
            cy.visit(baseUrl);
            cy.wait('@fetch');
            cy.get('table').should('have.length', 1);
        });
    });
