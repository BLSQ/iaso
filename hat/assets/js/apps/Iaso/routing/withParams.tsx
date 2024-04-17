import React from 'react';
import { useParams } from 'react-router-dom';

// Temporary fix to anable use of react-router 6 with class-components. Should be deleted when class components are removed
/** @deprecated */
export const withParams = ({ Component }) => {
    return function WrappedComponent(props: JSX.IntrinsicAttributes) {
        const params = useParams();
        return (
            <>
                <Component params={params} {...props} />
            </>
        );
    };
};
// wrapped ParamsHOC to avoid rule of hooks error
