/// <reference types='cypress' />

import superUser from '../../fixtures/profiles/me/superuser.json';
import {
    makeProjects,
    makeSourceVersionsFromSeed,
} from '../../support/dummyData';
import { testPagination } from '../../support/testPagination';
import { testPermission } from '../../support/testPermission';
import { testTablerender } from '../../support/testTableRender';
import { testTopBar } from '../../support/testTopBar';
import orgUnitTypes from '../../fixtures/orgunittypes/dummy-list.json';

const siteBaseUrl = Cypress.env('siteBaseUrl');

const baseUrl = `${siteBaseUrl}/dashboard/orgunits/types/order/name/pageSize/20/page/1`;

const projects = makeProjects(5, 'Project');

const dataSourceSeeds = Array(5)
    .fill()
    .map((_el, index) => ({
        id: index + 1,
        name: `datasource-${index + 1}`,
        versions: index + 1,
        defaultVersion: index % 2 > 0 ? 1 : null,
    }));

const sourceVersions = makeSourceVersionsFromSeed(dataSourceSeeds);

console.log(sourceVersions);

describe.only('Data sources', () => {
    console.log('sourceVersions', sourceVersions);
});
