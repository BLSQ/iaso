/**
 * @namespace
 * @property {object} filters
 * @property {string} filters.value        - new value  of the field
 * @property {string} filters.urlValue     - the value of the field in the url
 * @property {string} filters.selector     - selector of the filter
 * @property {string} filters.type         - type of the filter (text, multi, tree)
 */

export const testPageFilters = (
    filters,
    buttonSelector = '[data-test="search-button"]',
) => {
    Object.keys(filters).forEach(keyName => {
        const { value, type, selector } = filters[keyName];
        switch (type) {
            case 'text': {
                cy.get(selector).type('{selectall}').type(value);
                break;
            }
            case 'multi': {
                cy.fillMultiSelect(selector, value, false);
                break;
            }
            case 'tree': {
                cy.fillTreeView(selector, value, false);
                break;
            }
            default:
                break;
        }
    });
    cy.get(buttonSelector).click();

    Object.keys(filters).forEach(keyName => {
        const { urlValue } = filters[keyName];
        if (urlValue) {
            cy.url().should('contain', `/${keyName}/${urlValue}`);
        }
    });
};
