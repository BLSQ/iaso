import React, { forwardRef, useMemo } from 'react';
import { Link, LinkProps, useLocation } from 'react-router-dom';

// bluesquare-components' LinkWithLocation doesn't forward refs, which MUI requires for `component` props
export const LinkWithLocationForwardRef = forwardRef<
    HTMLAnchorElement,
    LinkProps
>((props, ref) => {
    const { pathname } = useLocation();
    const state = useMemo(
        () => ({ ...props.state, location: pathname }),
        [pathname, props.state],
    );
    return <Link {...props} ref={ref} state={state} />;
});

LinkWithLocationForwardRef.displayName = 'LinkWithLocationForwardRef';
