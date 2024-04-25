import React from 'react';
import { useParamsObject } from './hooks/useParamsObject';
import { baseUrls } from '../constants/urls';

// Temporary fix to enable use of react-router 6 with DHIS2 Mapping component.
/** @deprecated */
const withParams = Component => {
    return function WrappedComponent(props: JSX.IntrinsicAttributes) {
        const params = useParamsObject(baseUrls.mappings);
        return <Component params={params} {...props} />;
    };
};
// wrapped ParamsHOC to avoid rule of hooks error
export default withParams;
