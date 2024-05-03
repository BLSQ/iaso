import React, { FunctionComponent, useMemo } from 'react';
import { LinkProps, Link, useLocation } from 'react-router-dom';

export const LinkWithLocation: FunctionComponent<LinkProps> = props => {
    const { pathname: location } = useLocation();
    const state = useMemo(
        () => (props.state ? { ...props.state, location } : { location }),
        [location, props.state],
    );
    return <Link {...props} state={state} />;
};
