/* eslint-disable react/jsx-no-useless-fragment */
import React, { FunctionComponent, ReactElement } from 'react';
import {
    userHasAllPermissions,
    userHasOneOfPermissions,
} from '../domains/users/utils';
import { useCurrentUser } from '../utils/usersUtils';

type Props = {
    permissions: string[];
    children: false | ReactElement | ReactElement[];
    strict?: boolean;
};

export const DisplayIfUserHasPerm: FunctionComponent<Props> = ({
    permissions,
    children,
    strict = false,
}) => {
    const currentUser = useCurrentUser();
    if (strict) {
        if (userHasAllPermissions(permissions, currentUser) && children) {
            // Use fragment to avoid TS error when children is an array
            return <>{children}</>;
        }
    } else if (userHasOneOfPermissions(permissions, currentUser) && children) {
        // Use fragment to avoid TS error when children is an array
        return <>{children}</>;
    }

    return null;
};
