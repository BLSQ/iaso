export const testDownloadButtons = (
    selector = '[data-test="download-buttons"]',
    domain,
    orgUnitId,
) => {
    const href = fileType => {
        if (domain === 'orgunits') {
            return `/api/${domain}/?validation_status=all&parent_id=${orgUnitId}&order=name&limit=10&page=1&${fileType}=true`;
        }
        if (domain === 'links') {
            return `/api/${domain}/?orgUnitId=${orgUnitId}&order=-similarity_score&page=1&limit=10&${fileType}=true`;
        }
        return null;
    };

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
