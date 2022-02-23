import { formatThousand } from 'bluesquare-components';

// TODO add jsDocs
export const testPagination = ({
    baseUrl,
    apiPath,
    apiKey,
    fixture,
    withSearch,
}) =>
    describe('pagination', () => {
        beforeEach(() => {
            cy.intercept(
                {
                    pathname: apiPath,
                    query: {
                        page: '1',
                    },
                },
                fixture,
            ).as('getData');
            cy.visit(baseUrl);
            if (withSearch) cy.get('#searchButton').click();
        });
        it('click on next should display next page', () => {
            cy.wait('@getData').then(() => {
                cy.get('.pagination-page-select input')
                    .as('pageInput')
                    .should('have.value', 1);

                cy.get('button.pagination-previous')
                    .as('previousButton')
                    .should('be.disabled');
                cy.get('button.pagination-first')
                    .as('firstButton')
                    .should('be.disabled');
                cy.get('.pagination-count').should(
                    'contain',
                    `${formatThousand(fixture.count)}`,
                );

                cy.get('button.pagination-next').click();
                cy.get('@pageInput').should('have.value', 2);
                cy.get('@previousButton').should('not.be.disabled');
                cy.get('@firstButton').should('not.be.disabled');
            });
        });
        it('click on last should display last page', () => {
            cy.wait('@getData').then(() => {
                cy.get('.pagination-page-select input')
                    .as('pageInput')
                    .should('have.value', 1);

                cy.get('button.pagination-last').as('lastButton').click();

                cy.get('@lastButton').should('be.disabled');
                cy.get('@pageInput').should('have.value', fixture.pages);
            });
        });
        it('click on first should display first page', () => {
            cy.get('.pagination-page-select input')
                .as('pageInput')
                .should('have.value', 1);

            cy.intercept(
                {
                    pathname: apiPath,
                    query: {
                        page: `${fixture.pages}`,
                    },
                },
                fixture,
            ).as('getData');
            cy.get('button.pagination-last').click();
            cy.wait('@getData').then(() => {
                cy.get('button.pagination-first').click();
                cy.get('@pageInput').should('have.value', 1);
            });
        });
        it('changing rows count should display the correct ammount of rows', () => {
            cy.get('.pagination-row-select').click();
            const pageSize = 5;
            const res = { ...fixture };
            res[apiKey] = res[apiKey].slice(0, pageSize);
            cy.intercept(
                {
                    pathname: apiPath,
                    query: {
                        limit: `${pageSize}`,
                    },
                },
                res,
            ).as('getData');
            cy.get(`.row-option-${pageSize}`).click();

            cy.wait('@getData').then(() => {
                const table = cy.get('table');
                table.should('have.length', 1);
                const rows = table.find('tbody').find('tr');
                rows.should('have.length', pageSize);
            });
        });
        if (withSearch)
            it('search again should go to first page', () => {
                cy.intercept(
                    {
                        pathname: apiPath,
                    },
                    fixture,
                ).as('getData');
                cy.get('button.pagination-next').click();

                cy.wait('@getData').then(() => {
                    cy.get('.pagination-page-select input')
                        .as('pageInput')
                        .should('have.value', 2);
                    const search = 'ZELDA';
                    cy.get('#search-search-0').type(search);
                    const res = { ...fixture };
                    res[apiKey] = res[apiKey].slice(0, 1);
                    cy.intercept(
                        {
                            pathname: apiPath,
                        },
                        res,
                    ).as('getSearch');
                    cy.get('#searchButton').click();

                    cy.wait('@getSearch').then(() => {
                        cy.get('@pageInput').should('have.value', 1);
                    });
                });
            });
    });
