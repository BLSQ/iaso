/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import React from 'react';
import { baseUrls } from '../constants/urls';
import { useParamsObject } from './hooks/useParamsObject';

// Temporary fix to enable use of react-router 6 with DHIS2 Mapping component.
/** @deprecated */
export const withParams = Component => {
    return function WrappedComponent(props) {
        const params = useParamsObject(baseUrls.mappings);
        return <Component params={params} {...props} />;
    };
};
// wrapped ParamsHOC to avoid rule of hooks error

// Temporary fix to enable use of react-router 6 with DHIS2 Mapping component.
/** @deprecated */
export const withMappingDetailsParams = Component => {
    return function WrappedComponent(props) {
        const params = useParamsObject(baseUrls.mappingDetail);
        return <Component params={params} {...props} />;
    };
};
// wrapped ParamsHOC to avoid rule of hooks error
