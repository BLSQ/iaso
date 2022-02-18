// Won't work if table is combined with a search feature
// TODO wrap in describe
export const testTablerender = (baseUrl, rows, columns) =>
    describe('When table renders', () => {
        it('Displays Table with right amount of rows and columns', () => {
            cy.visit(baseUrl);
            const table = cy.get('table');
            table.should('have.length', 1);
            const tableRows = table.find('tbody').find('tr');
            tableRows.should('have.length', rows);
            // number of col
            tableRows.eq(0).find('td').should('have.length', columns);
        });
        it("Displays an empty table when there's no data", () => {
            cy.intercept(
                'GET',
                '/api/orgunittypes/?order=name&limit=20&page=1',
                {
                    fixture: 'orgunittypes/empty-list.json',
                },
            );
            cy.visit(baseUrl);
            cy.get('table').should('have.length', 1);
        });
    });
