import React from 'react';
import { Redirect, Route } from 'react-router';

import {
    // @ts-ignore
    getSort,
} from 'bluesquare-components';

import { cloneDeep } from 'lodash';
import { baseUrls } from '../constants/urls';
import Page404 from '../components/errors/Page404';

import { defaultSorted as storageDefaultSort } from '../domains/storages/config.tsx';
import { defaultSorted as workflowDefaultSort } from '../domains/workflows/config/index.tsx';
import { getOrgUnitsUrl } from '../domains/orgUnits/utils';

const getRedirections = overrideLanding => {
    const getPaginationParams = (order = 'id', pageSize = 20) =>
        `/order/${order}/pageSize/${pageSize}/page/1`;
    return [
        {
            path: '/',
            to: overrideLanding ?? baseUrls.forms,
        },
        {
            path: `${baseUrls.orgUnits}`,
            to: getOrgUnitsUrl(),
        },
        {
            path: `${baseUrls.mappings}`,
            to: `${baseUrls.mappings}${getPaginationParams(
                'form_version__form__name,form_version__version_id,mapping__mapping_type',
            )}`,
        },
        {
            path: `${baseUrls.users}`,
            to: `${baseUrls.users}${getPaginationParams('user__username')}`,
        },
        {
            path: `${baseUrls.userRoles}`,
            to: `${baseUrls.userRoles}${getPaginationParams('group__name')}`,
        },
        {
            path: `${baseUrls.entities}`,
            to: `${baseUrls.entities}${getPaginationParams(
                'last_saved_instance',
            )}`,
        },
        {
            path: `${baseUrls.entityTypes}`,
            to: `${baseUrls.entityTypes}${getPaginationParams('name')}`,
        },
        {
            path: `${baseUrls.entityDuplicates}`,
            to: `${baseUrls.entityDuplicates}${getPaginationParams()}`,
        },
        {
            path: `${baseUrls.groups}`,
            to: `${baseUrls.groups}${getPaginationParams('name')}`,
        },
        {
            path: `${baseUrls.orgUnitTypes}`,
            to: `${baseUrls.orgUnitTypes}${getPaginationParams('name')}`,
        },
        {
            path: `${baseUrls.planning}`,
            to: `${baseUrls.planning}/publishingStatus/all${getPaginationParams(
                'name',
            )}`,
        },
        {
            path: `${baseUrls.teams}`,
            to: `${baseUrls.teams}${getPaginationParams('name')}`,
        },
        {
            path: `${baseUrls.storages}`,
            to: `${baseUrls.storages}${getPaginationParams(
                getSort(storageDefaultSort),
            )}`,
        },
        {
            path: `${baseUrls.workflows}/entityTypeId/:entityTypeId`,
            to: `${
                baseUrls.workflows
            }/entityTypeId/:entityTypeId/order/${getSort(
                workflowDefaultSort,
            )}/pageSize/20/page/1`,
        },
        // Keep compatibility with the olds url for instance as they got renamed in Nov 2021
        {
            path: '/instance/instanceId/:instanceId',
            to: '/forms/submission/instanceId/:instanceId',
        },
        // idem and the formId parameter was renamed to formIds (with s) to support multiple form
        {
            path:
                '/instances/formId/:formId(/order/:order)(/pageSize/:pageSize)(/page/:page)(/dateFrom/:dateFrom)' +
                '(/dateTo/:dateTo)(/periods/:periods)(/status/:status)(/levels/:levels)(/orgUnitTypeId/:orgUnitTypeId)' +
                '(/withLocation/:withLocation)(/deviceId/:deviceId)(/deviceOwnershipId/:deviceOwnershipId)(/tab/:tab)(/columns/:columns)(/search/:search)(/showDeleted/:showDeleted)',
            to:
                '/forms/submissions(/formIds/:formId)(/order/:order)(/pageSize/:pageSize)(/page/:page)(/dateFrom/:dateFrom)' +
                '(/dateTo/:dateTo)(/periods/:periods)(/status/:status)(/levels/:levels)(/orgUnitTypeId/:orgUnitTypeId)' +
                '(/withLocation/:withLocation)(/deviceId/:deviceId)(/deviceOwnershipId/:deviceOwnershipId)(/tab/:tab)(/columns/:columns)(/search/:search)(/showDeleted/:showDeleted)',
        },
        {
            path: '/*',
            component: ({ location }) => <Page404 location={location} />,
        },
    ];
};
const getRoutes = (baseRoutes, overrideLanding) =>
    cloneDeep(baseRoutes).concat(
        getRedirections(overrideLanding).map(redirection => {
            if (redirection.component) {
                return (
                    <Route
                        path={redirection.path}
                        component={redirection.component}
                    />
                );
            }
            return <Redirect path={redirection.path} to={redirection.to} />;
        }),
    );

export { getRoutes };
