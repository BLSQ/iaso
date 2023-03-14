import { formatThousand } from 'bluesquare-components';

// TODO add jsDocs
export const testPagination = ({
    baseUrl,
    apiPath,
    apiKey,
    fixture,
    withSearch,
    query = {
        page: '1',
    },
    selector = 'body',
}) =>
    describe('pagination', () => {
        beforeEach(() => {
            cy.intercept(
                {
                    pathname: apiPath,
                    query,
                },
                fixture,
            ).as('query');
            cy.visit(baseUrl);
            if (withSearch) {
                cy.get(selector).find('[data-test="search-button"]').click();
            }

            cy.wait('@query', { timeout: 10000 });
            cy.get(selector).as('selector');
            cy.get('@selector').should('exist');
        });
        it('click on next should display next page', () => {
            cy.get('@selector')
                .find('.pagination-page-select input')
                .should('have.value', 1);

            cy.get('@selector')
                .find('button.pagination-previous')
                .should('be.disabled');
            cy.get('@selector')
                .find('button.pagination-first')
                .should('be.disabled');
            cy.get('@selector')
                .find('.pagination-count')
                .should('contain', `${formatThousand(fixture.count)}`);

            cy.get('@selector')
                .find('button.pagination-next')
                .should('exist')
                .click({ force: true });
            cy.get('@selector')
                .find('.pagination-page-select input')
                .should('have.value', 2);
            cy.get('@selector')
                .find('button.pagination-previous')
                .should('not.be.disabled');
            cy.get('@selector')
                .find('button.pagination-first')
                .should('not.be.disabled');
        });
        it('click on last should display last page', () => {
            cy.get('@selector')
                .find('.pagination-page-select input')
                .should('have.value', 1);

            cy.get(selector)
                .find('button.pagination-last')
                .should('exist')
                .click({ force: true });

            cy.get('@selector')
                .find('button.pagination-last')
                .should('be.disabled');
            cy.get('@selector')
                .find('.pagination-page-select input')
                .should('have.value', fixture.pages);
        });
        it('click on first should display first page', () => {
            cy.get('@selector')
                .find('.pagination-page-select input')
                .should('have.value', 1);

            cy.intercept(
                {
                    pathname: apiPath,
                    query: {
                        page: `${fixture.pages}`,
                    },
                },
                {
                    ...fixture,
                    has_next: false,
                    has_previous: true,
                    page: 2,
                },
            ).as('getData');
            cy.get('@selector')
                .find('button.pagination-last')
                .click({ force: true });
            cy.wait('@getData').then(() => {
                cy.wait(100);
                cy.get('@selector')
                    .find('button.pagination-first')
                    .click({ force: true });
                cy.get('@selector')
                    .find('.pagination-page-select input')
                    .should('have.value', 1);
            });
        });
        it(
            'changing rows count should display the correct ammount of rows',
            {
                retries: {
                    runMode: 2,
                    openMode: 2,
                },
            },
            () => {
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

                cy.wait(1000);
                cy.get(`${selector} .pagination-row-select`)
                    // .as('rowSelector')
                    // .should('exist')
                    .click();
                cy.get(`.row-option-${pageSize}`).click();

                cy.wait('@getData').then(() => {
                    const table = cy.get('@selector').find('table');
                    table.should('have.length', 1);
                    const rows = table.find('tbody').find('tr');
                    rows.should('have.length', pageSize);
                });
            },
        );
        if (withSearch)
            it('search again should go to first page', () => {
                cy.intercept(
                    {
                        pathname: apiPath,
                    },
                    fixture,
                ).as('getData');

                cy.get('@selector')
                    .find('button.pagination-next')
                    .click({ force: true });

                cy.wait('@getData').then(() => {
                    cy.get('@selector')
                        .find('.pagination-page-select input')
                        .as('pageInput')
                        .should('have.value', 2);
                    const search = 'ZELDA';
                    cy.get('@selector').find('#search-search').type(search);
                    const res = { ...fixture };
                    res[apiKey] = res[apiKey].slice(0, 1);
                    cy.intercept(
                        {
                            pathname: apiPath,
                        },
                        res,
                    ).as('getSearch');
                    cy.get('@selector')
                        .find('[data-test="search-button"]')
                        .click();

                    cy.wait('@getSearch').then(() => {
                        cy.get('@pageInput').should('have.value', 1);
                    });
                });
            });
    });
