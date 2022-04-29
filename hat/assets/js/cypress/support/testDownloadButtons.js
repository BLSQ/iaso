const href = fileType =>
    `/api/orgunits/?&parent_id=1&limit=10&order=name&validation_status=all&${fileType}=true`;

export const testDownloadButtons = (
    selector = '[data-test="download-buttons"]',
) => {
    // csv
    cy.get(selector).find('a').eq(0).as('csvExportButton');

    cy.get('@csvExportButton').should('have.attr', 'href', href('csv'));

    // xlsx
    cy.get(selector).find('a').eq(1).as('xlsxExportButton');

    cy.get('@xlsxExportButton').should('have.attr', 'href', href('xlsx'));

    // gpkg
    cy.get('body').then($body => {
        if ($body.find(`${selector} [data-test="gpkg-export-button"]`).length) {
            cy.get(selector).find('a').eq(2).as('gpkgExportButton');

            cy.get('@gpkgExportButton').should(
                'have.attr',
                'href',
                href('gpkg'),
            );
        }
    });
};
