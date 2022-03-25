/// <reference types='cypress' />

import superUser from '../../fixtures/profiles/me/superuser.json';
import { testPagination } from '../../support/testPagination';
import { testPermission } from '../../support/testPermission';
import { testTablerender } from '../../support/testTableRender';
import { testTopBar } from '../../support/testTopBar';

const siteBaseUrl = Cypress.env('siteBaseUrl');

const baseUrl = `${siteBaseUrl}/dashboard/orgunits/types/order/name/pageSize/20/page/1`;

describe("Data sources",()=>{
    
})