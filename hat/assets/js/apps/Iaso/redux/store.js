import React from 'react';
import { Redirect, useRouterHistory } from 'react-router';
import { syncHistoryWithStore, routerMiddleware } from 'react-router-redux';
import thunk from 'redux-thunk';
import { createHistory } from 'history';

import createStore from './createStore';

import appReducer from '../domains/app/reducer';
import { loadReducer } from './load';
import {
    currentUserReducer,
    currentUserInitialState,
} from './currentUserReducer';
import { formsReducer, formsInitialState } from '../domains/forms/reducer';
import {
    orgUnitsReducer,
    orgUnitsInitialState,
} from '../domains/orgUnits/reducer';
import {
    projectsReducer,
    projectsInitialState,
} from '../domains/projects/reducer';
import { mapReducer, mapInitialState } from './mapReducer';
import {
    instancesReducer,
    instancesInitialState,
} from '../domains/instances/reducer';
import {
    mappingReducer,
    mappingsInitialState,
} from '../domains/mappings/reducer';
import {
    sidebarMenuReducer,
    sidebarMenuInitialState,
} from './sidebarMenuReducer';
import { snackBarsInitialState, snackBarsReducer } from './snackBarsReducer';
import { devicesInitialState, devicesReducer } from './devicesReducer';
import {
    orgUnitsLevelsInitialState,
    orgUnitsLevelsReducer,
} from './orgUnitsLevelsReducer';
import { routerInitialState, routerReducer } from './routerReducer';
import { linksInitialState, linksReducer } from '../domains/links/reducer';
import { usersReducer, usersInitialState } from '../domains/users/reducer';
import {
    periodsInitialState,
    periodsReducer,
} from '../domains/periods/reducer';
import {
    completenessInitialState,
    reducer as completenessReducer,
} from '../domains/completeness/reducer';
import {
    groupsInitialState,
    reducer as groupsReducer,
} from '../domains/orgUnits/groups/reducer';
import {
    orgUnitsTypesInitialState,
    reducer as orgUnitsTypesReducer,
} from '../domains/orgUnits/types/reducer';

import { getChipColors } from '../constants/chipColors';

import { locationLimitMax } from '../domains/orgUnits/constants/orgUnitConstants';

import { baseUrls } from '../constants/urls';

const addRoutes = baseRoutes =>
    baseRoutes.concat([
        <Redirect path="/" to={baseUrls.forms} />,
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
            path={baseUrls.groups}
            to={`${baseUrls.groups}/order/name/pageSize/20/page/1`}
        />,
        <Redirect
            path={baseUrls.orgUnitTypes}
            to={`${baseUrls.orgUnitTypes}/order/name/pageSize/20/page/1`}
        />,
    ]);

// TODO pass baseUrl without hardcoding it
let storeHistory = useRouterHistory(createHistory)({
    basename: '/dashboard',
});
// TODO: to check, this initial state argument is probably useless
const store = createStore(
    {
        load: {},
        currentUser: currentUserInitialState,
        sidebar: sidebarMenuInitialState,
        forms: formsInitialState,
        orgUnits: orgUnitsInitialState,
        instances: instancesInitialState,
        snackBar: snackBarsInitialState,
        map: mapInitialState,
        devices: devicesInitialState,
        orgUnitsLevels: orgUnitsLevelsInitialState,
        routerCustom: routerInitialState,
        links: linksInitialState,
        users: usersInitialState,
        periods: periodsInitialState,
        completeness: completenessInitialState,
        projects: projectsInitialState,
        mappings: mappingsInitialState,
        groups: groupsInitialState,
        orgUnitsTypes: orgUnitsTypesInitialState,
    },
    {
        app: appReducer,
        load: loadReducer,
        currentUser: currentUserReducer,
        sidebar: sidebarMenuReducer,
        forms: formsReducer,
        orgUnits: orgUnitsReducer,
        instances: instancesReducer,
        snackBar: snackBarsReducer,
        map: mapReducer,
        devices: devicesReducer,
        orgUnitsLevels: orgUnitsLevelsReducer,
        routerCustom: routerReducer,
        links: linksReducer,
        users: usersReducer,
        periods: periodsReducer,
        completeness: completenessReducer,
        projects: projectsReducer,
        mappings: mappingReducer,
        groups: groupsReducer,
        orgUnitsTypes: orgUnitsTypesReducer,
    },
    [routerMiddleware(storeHistory), thunk],
);
// TODO: see if mutation necessary. If not don't reassign history and initialize history const here
storeHistory = syncHistoryWithStore(storeHistory, store);

const history = storeHistory;
const { dispatch } = store;

export { store, addRoutes, history, dispatch };
