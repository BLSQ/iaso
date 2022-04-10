/**
 * @namespace
 * @property {object}  props
 * @property {number} props.colIndex     - Index of the column
 * @property {string} props.order        - the key used to sort results
 * @property {string} props.apiPath      - api path used
 * @property {object} props.fixture       - fixture used
 * @property {object} props.defaultQuery - default api query params
 */
export const testTableSort = props => {
    const { colIndex, order, apiPath, fixture, defaultQuery } = props;
    cy.get('table').as('table');
    let flag = false;
    const query = {
        ...defaultQuery,
        order,
    };
    cy.intercept(
        {
            method: 'GET',
            pathname: `/api/${apiPath}/**`,
            times: 4,
            query,
        },
        req => {
            flag = true;
            req.reply({
                statusCode: 200,
                body: fixture,
            });
        },
    ).as('getRequest');
    cy.get('@table').find('thead').find('th').eq(colIndex).as('col');
    cy.get('@col').click();
    cy.wait('@getRequest').then(() => {
        cy.wrap(flag).should('eq', true);
        cy.url().should('contain', `order/${order}`);
        if (order.charAt(0) !== '-') {
            testTableSort({
                ...props,
                order: `-${props.order}`,
            });
        }
    });
};
