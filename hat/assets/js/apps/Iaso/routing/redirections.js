import React from 'react';
import { Redirect, Route } from 'react-router';
import { baseUrls } from '../constants/urls';
import { getChipColors } from '../constants/chipColors';

import { locationLimitMax } from '../domains/orgUnits/constants/orgUnitConstants';
import Page404 from '../components/errors/Page404';

const addRoutes = (baseRoutes, overrideLanding) => {
    return baseRoutes.concat([
        <Redirect path="/" to={overrideLanding ?? baseUrls.forms} />,
        <Redirect
            path={baseUrls.orgUnits}
            to={`${
                baseUrls.orgUnits
            }/locationLimit/${locationLimitMax}/order/id/pageSize/50/page/1/searchTabIndex/0/searches/[{"validation_status":"all", "color":"${getChipColors(
                0,
            ).replace('#', '')}"}]`}
        />,
        <Redirect
            path={baseUrls.mappings}
            to={`${baseUrls.mappings}/order/form_version__form__name,form_version__version_id,mapping__mapping_type/pageSize/20/page/1`}
        />,
        <Redirect
            path={baseUrls.users}
            to={`${baseUrls.users}/order/user__username/pageSize/20/page/1`}
        />,
        <Redirect
            path={baseUrls.entities}
            to={`${baseUrls.entities}/order/name/pageSize/20/page/1`}
        />,
        <Redirect
            path={baseUrls.entityTypes}
            to={`${baseUrls.entityTypes}/order/name/pageSize/20/page/1`}
        />,
        <Redirect
            path={baseUrls.groups}
            to={`${baseUrls.groups}/order/name/pageSize/20/page/1`}
        />,
        <Redirect
            path={baseUrls.orgUnitTypes}
            to={`${baseUrls.orgUnitTypes}/order/name/pageSize/20/page/1`}
        />,
        <Redirect
            path={baseUrls.planning}
            to={`${baseUrls.planning}/publishingStatus/all/order/name/pageSize/20/page/1`}
        />,
        <Redirect
            path={baseUrls.teams}
            to={`${baseUrls.teams}/order/name/pageSize/20/page/1`}
        />,
        // Keep compatibility with the olds url for instance as they got renamed in Nov 2021
        <Redirect
            path="/instance/instanceId/:instanceId"
            to="/forms/submission/instanceId/:instanceId"
        />,
        // idem and the formId parameter was renamed to formIds (with s) to support multiple form
        <Redirect
            /* eslint-disable-next-line max-len */
            path="/instances/formId/:formId(/order/:order)(/pageSize/:pageSize)(/page/:page)(/dateFrom/:dateFrom)(/dateTo/:dateTo)(/periods/:periods)(/status/:status)(/levels/:levels)(/orgUnitTypeId/:orgUnitTypeId)(/withLocation/:withLocation)(/deviceId/:deviceId)(/deviceOwnershipId/:deviceOwnershipId)(/tab/:tab)(/columns/:columns)(/search/:search)(/showDeleted/:showDeleted)"
            /* eslint-disable-next-line max-len */
            to="/forms/submissions(/formIds/:formId)(/order/:order)(/pageSize/:pageSize)(/page/:page)(/dateFrom/:dateFrom)(/dateTo/:dateTo)(/periods/:periods)(/status/:status)(/levels/:levels)(/orgUnitTypeId/:orgUnitTypeId)(/withLocation/:withLocation)(/deviceId/:deviceId)(/deviceOwnershipId/:deviceOwnershipId)(/tab/:tab)(/columns/:columns)(/search/:search)(/showDeleted/:showDeleted)"
        />,
        // Catch all route, need to be at the end
        <Route
            path="/*"
            component={({ location }) => <Page404 location={location} />}
        />,
    ]);
};

export { addRoutes };
