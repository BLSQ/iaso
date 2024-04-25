import React, { FunctionComponent } from 'react';
import { Navigate, useLocation, useParams } from 'react-router-dom';

type Props = {
    to: string; // redirection url
    path: any;
};

/**
 * Wrapper for react-router-dom `<Navigate/>`. Manually replaces param values in destination url
 *
 */

export const Redirect: FunctionComponent<Props> = ({ to, path }) => {
    const params = useParams();
    const { state } = useLocation();
    let destination = to;
    const keysToConvert = Object.keys(path?.conversions ?? {});
    Object.entries(params).forEach(([key, value]) => {
        if (keysToConvert.includes(key)) {
            destination = destination.replace(
                `:${path.conversions[key]}`,
                `${value}`,
            );
        } else {
            destination = destination.replace(`:${key}`, `${value}`);
        }
    });
    // After the params specified in the redirection have been matched and the values replaced,
    // append all other params (ie the rest of the url) as is
    if (params['*']) {
        destination = `${destination}${params['*']}`;
    }

    return <Navigate to={`${destination}`} state={state} replace />;
};
