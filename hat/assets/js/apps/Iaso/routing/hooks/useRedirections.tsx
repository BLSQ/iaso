import { getSort } from 'bluesquare-components';
import { Route } from 'react-router-dom';
import React, { ReactElement } from 'react';
import { baseUrls } from '../../constants/urls';
import Page404 from '../../components/errors/Page404';
import { defaultSorted as storageDefaultSort } from '../../domains/storages/config';
import { defaultSorted as workflowDefaultSort } from '../../domains/workflows/config/index';
import { useHomeOfflineComponent } from '../../domains/app/hooks/useRoutes';
import { useCurrentUser } from '../../utils/usersUtils';
import { getOrgUnitsUrl } from '../utils';
import { Redirect } from '../Redirect';

const getPaginationParams = (order = 'id', pageSize = 20) =>
    `/order/${order}/pageSize/${pageSize}/page/1`;
const setupRedirections = [
    {
        path: '/',
        to: `/${baseUrls.setupAccount}`,
    },
    {
        path: '/home',
        to: `/${baseUrls.setupAccount}`,
    },
    {
        path: '/*',
        element: <Page404 />,
    },
];

const baseRedirections = [
    {
        path: `/${baseUrls.orgUnits}`,
        // @ts-ignore
        to: getOrgUnitsUrl(),
    },
    {
        path: `/${baseUrls.mappings}`,
        to: `/${baseUrls.mappings}${getPaginationParams(
            'form_version__form__name,form_version__version_id,mapping__mapping_type',
        )}`,
    },
    {
        path: `/${baseUrls.users}`,
        to: `/${baseUrls.users}${getPaginationParams('user__username')}`,
    },
    {
        path: `/${baseUrls.entities}`,
        to: `/${baseUrls.entities}${getPaginationParams(
            'last_saved_instance',
        )}`,
    },
    {
        path: `/${baseUrls.entityTypes}`,
        to: `/${baseUrls.entityTypes}${getPaginationParams('name')}`,
    },
    {
        path: `/${baseUrls.entityDuplicates}`,
        to: `/${baseUrls.entityDuplicates}${getPaginationParams()}`,
    },
    {
        path: `/${baseUrls.groups}`,
        to: `/${baseUrls.groups}${getPaginationParams('name')}`,
    },
    {
        path: `/${baseUrls.orgUnitTypes}`,
        to: `/${baseUrls.orgUnitTypes}${getPaginationParams('name')}`,
    },
    {
        path: `/${baseUrls.planning}`,
        to: `/${baseUrls.planning}/publishingStatus/all${getPaginationParams(
            'name',
        )}`,
    },
    {
        path: `/${baseUrls.teams}`,
        to: `/${baseUrls.teams}${getPaginationParams('id')}`,
    },
    {
        path: `/${baseUrls.storages}`,
        to: `/${baseUrls.storages}${getPaginationParams(
            getSort(storageDefaultSort),
        )}`,
    },
    {
        path: `/${baseUrls.workflows}/entityTypeId/:entityTypeId`,
        to: `/${baseUrls.workflows}/entityTypeId/:entityTypeId/order/${getSort(
            workflowDefaultSort,
        )}/pageSize/20/page/1`,
    },
    {
        path: `/${baseUrls.workflows}/accountId/:accountId/entityTypeId/:entityTypeId`,
        to: `/${
            baseUrls.workflows
        }/accountId/:accountId/entityTypeId/:entityTypeId/order/${getSort(
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
        path: '/instances/formId/:formId/*',
        conversions: { formId: 'formIds' },
        to: '/forms/submissions/formIds/:formId/',
    },
    // legacy
    // {
    //     path:
    //         '/instances/formId/:formId(/order/:order)(/pageSize/:pageSize)(/page/:page)(/dateFrom/:dateFrom)' +
    //         '(/dateTo/:dateTo)(/periods/:periods)(/status/:status)(/levels/:levels)(/orgUnitTypeId/:orgUnitTypeId)' +
    //         '(/withLocation/:withLocation)(/deviceId/:deviceId)(/deviceOwnershipId/:deviceOwnershipId)(/tab/:tab)(/columns/:columns)(/search/:search)(/showDeleted/:showDeleted)',
    //     to:
    //         '/forms/submissions(/formIds/:formId)(/order/:order)(/pageSize/:pageSize)(/page/:page)(/dateFrom/:dateFrom)' +
    //         '(/dateTo/:dateTo)(/periods/:periods)(/status/:status)(/levels/:levels)(/orgUnitTypeId/:orgUnitTypeId)' +
    //         '(/withLocation/:withLocation)(/deviceId/:deviceId)(/deviceOwnershipId/:deviceOwnershipId)(/tab/:tab)(/columns/:columns)(/search/:search)(/showDeleted/:showDeleted)',
    // },
    {
        path: '/*',
        element: <Page404 />,
    },
];

type UseRedirectionsArgs = {
    hasNoAccount: boolean;
    isFetchingCurrentUser: boolean;
    homeUrl?: string;
    pluginRedirections: any[];
};
// eslint-disable-next-line no-unused-vars
type RedirectionsMethod = (args: UseRedirectionsArgs) => ReactElement[];

export const useRedirections: RedirectionsMethod = ({
    hasNoAccount,
    isFetchingCurrentUser,
    homeUrl = `/${baseUrls.forms}`,
    pluginRedirections,
}) => {
    let redirections;
    const currentUser = useCurrentUser();
    const homeOfflineComponent = useHomeOfflineComponent();
    if (hasNoAccount) {
        redirections = setupRedirections;
    } else if (
        !homeOfflineComponent &&
        !isFetchingCurrentUser &&
        !currentUser
    ) {
        redirections = [
            {
                path: '/home',
                to: '/login',
            },
        ];
    } else {
        redirections = [
            {
                path: '/',
                to: homeUrl,
            },
            {
                path: '/home',
                to: homeUrl,
            },
            ...baseRedirections,
            ...pluginRedirections,
        ];
    }
    return redirections.map(redirection => {
        if (redirection.element) {
            return (
                <Route
                    path={redirection.path}
                    element={redirection.element}
                    key={`${redirection.path}${redirection.to}`}
                />
            );
        }
        return (
            <Route
                path={`${redirection.path}`}
                key={`${redirection.path}${redirection.to}`}
                element={
                    <Redirect to={redirection.to} path={redirection.path} />
                }
            />
        );
    });
};
