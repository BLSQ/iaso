import React from 'react';
import { Redirect, Route } from 'react-router';

import {
    // @ts-ignore
    getSort,
} from 'bluesquare-components';

import { baseUrls } from '../constants/urls';
import { getChipColors } from '../constants/chipColors';

import { locationLimitMax } from '../domains/orgUnits/constants/orgUnitConstants';
import Page404 from '../components/errors/Page404';

import { defaultSorted as storageDefaultSort } from '../domains/storages/config.tsx';

const getRedirections = overrideLanding => {
    const getPaginationParams = (order = 'id') =>
        `/order/${order}/pageSize/20/page/1`;
    return [
        {
            path: '/',
            to: overrideLanding ?? baseUrls.forms,
        },
        {
            path: `${baseUrls.orgUnits}/accountId/:accountId`,
            to: `${
                baseUrls.orgUnits
            }/locationLimit/${locationLimitMax}${getPaginationParams()}/searchTabIndex/0/searches/[{"validation_status":"all", "color":"${getChipColors(
                0,
            ).replace('#', '')}"}]/accountId/:accountId`,
        },
        {
            path: `${baseUrls.mappings}/accountId/:accountId`,
            to: `${baseUrls.mappings}${getPaginationParams(
                'form_version__form__name,form_version__version_id,mapping__mapping_type',
            )}/accountId/:accountId`,
        },
        {
            path: `${baseUrls.users}/accountId/:accountId`,
            to: `${baseUrls.users}${getPaginationParams(
                'user__username',
            )}/accountId/:accountId`,
        },
        {
            path: `${baseUrls.entities}/accountId/:accountId`,
            to: `${baseUrls.entities}${getPaginationParams(
                'last_saved_instance',
            )}/accountId/:accountId`,
        },
        {
            path: `${baseUrls.entityTypes}/accountId/:accountId`,
            to: `${baseUrls.entityTypes}${getPaginationParams(
                'name',
            )}/accountId/:accountId`,
        },
        {
            path: `${baseUrls.groups}/accountId/:accountId`,
            to: `${baseUrls.groups}${getPaginationParams(
                'name',
            )}/accountId/:accountId`,
        },
        {
            path: `${baseUrls.orgUnitTypes}/accountId/:accountId`,
            to: `${baseUrls.orgUnitTypes}${getPaginationParams(
                'name',
            )}/accountId/:accountId`,
        },
        {
            path: `${baseUrls.planning}/accountId/:accountId`,
            to: `${baseUrls.planning}/publishingStatus/all${getPaginationParams(
                'name',
            )}/accountId/:accountId`,
        },
        {
            path: `${baseUrls.teams}/accountId/:accountId`,
            to: `${baseUrls.teams}${getPaginationParams(
                'name',
            )}/accountId/:accountId`,
        },
        {
            path: `${baseUrls.storages}/accountId/:accountId`,
            to: `${baseUrls.storages}${getPaginationParams(
                getSort(storageDefaultSort),
            )}/accountId/:accountId`,
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

const useAddRoutes = (baseRoutes, overrideLanding) => {
    const getRoutes = () =>
        [...baseRoutes].concat(
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
    return getRoutes;
};

export { useAddRoutes };
