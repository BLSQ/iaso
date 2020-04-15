
import React from 'react';
import {
    formsPath,
    mappingsPath,
    mappingDetailPath,
    instancesPath,
    orgUnitsPath,
    instanceDetailPath,
    orgUnitsDetailsPath,
    linksPath,
    algosPath,
    completenessPath,
} from './paths';

import Forms from '../domains/forms';
import OrgUnits from '../domains/orgUnits';
import Links from '../domains/links';
import Runs from '../domains/links/Runs';
import OrgUnitDetail from '../domains/orgUnits/details';
import Completeness from '../domains/completeness';
import Instances from '../domains/instances';
import InstanceDetail from '../domains/instances/details';
import Mappings from '../domains/mappings';
import MappingDetails from '../domains/mappings/details';


export const routeMapping = [
    {
        baseUrl: formsPath.baseUrl,
        component: props => <Forms {...props} />,
    },
    {
        baseUrl: mappingsPath.baseUrl,
        component: props => <Mappings {...props} />,
    },
    {
        baseUrl: mappingDetailPath.baseUrl,
        component: props => <MappingDetails {...props} />,
    },
    {
        baseUrl: instancesPath.baseUrl,
        component: props => <Instances {...props} />,
    },
    {
        baseUrl: instanceDetailPath.baseUrl,
        component: props => <InstanceDetail {...props} />,
    },
    {
        baseUrl: orgUnitsPath.baseUrl,
        component: props => <OrgUnits {...props} />,
    },
    {
        baseUrl: orgUnitsDetailsPath.baseUrl,
        component: props => <OrgUnitDetail {...props} />,
    },
    {
        baseUrl: linksPath.baseUrl,
        component: props => <Links {...props} />,
    },
    {
        baseUrl: algosPath.baseUrl,
        component: props => <Runs {...props} />,
    },
    {
        baseUrl: completenessPath.baseUrl,
        component: props => <Completeness {...props} />,
    },
];
