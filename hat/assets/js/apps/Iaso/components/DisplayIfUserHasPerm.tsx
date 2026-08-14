import React, { FunctionComponent, ReactElement } from 'react';
import {
    useCurrentUserHasAllPermissions,
    useCurrentUserHasOneOfPermissions,
} from 'Iaso/domains/users/utils';

type Props = {
    permissions: string[];
    children: false | ReactElement | ReactElement[];
    strict?: boolean;
};

const DisplayIfUserHasPermNotStrict: FunctionComponent<
    Omit<Props, 'strict'>
> = ({ permissions, children }) => {
    const hasPermissions = useCurrentUserHasOneOfPermissions(permissions);

    if (hasPermissions && children) return <>{children}</>;

    return null;
};

const DisplayIfUserHasPermStrict: FunctionComponent<Omit<Props, 'strict'>> = ({
    permissions,
    children,
}) => {
    const hasPermissions = useCurrentUserHasAllPermissions(permissions);
    if (hasPermissions && children) return <>{children}</>;

    return null;
};

export const DisplayIfUserHasPerm: FunctionComponent<Props> = ({
    permissions,
    children,
    strict = false,
}) => {
    if (strict) {
        return (
            <DisplayIfUserHasPermStrict permissions={permissions}>
                {children}
            </DisplayIfUserHasPermStrict>
        );
    } else {
        return (
            <DisplayIfUserHasPermNotStrict permissions={permissions}>
                {children}
            </DisplayIfUserHasPermNotStrict>
        );
    }
};
