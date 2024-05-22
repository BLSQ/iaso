import { FunctionComponent, ReactElement } from 'react';
import {
    userHasAllPermissions,
    userHasOneOfPermissions,
} from '../domains/users/utils';
import { useCurrentUser } from '../utils/usersUtils';

type Props = {
    permissions: string[];
    children: ReactElement;
    strict?: boolean;
};

export const DisplayIfUserHasPerm: FunctionComponent<Props> = ({
    permissions,
    children,
    strict = false,
}) => {
    const currentUser = useCurrentUser();
    if (strict) {
        if (userHasAllPermissions(permissions, currentUser)) {
            return children;
        }
    } else if (userHasOneOfPermissions(permissions, currentUser)) {
        return children;
    }

    return null;
};
