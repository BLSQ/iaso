import { FunctionComponent, ReactElement } from 'react';
import { userHasOneOfPermissions } from '../domains/users/utils';
import { useCurrentUser } from '../utils/usersUtils';

type Props = {
    permissions: string[];
    children: ReactElement;
};

export const DisplayIfUserHasPerm: FunctionComponent<Props> = ({
    permissions,
    children,
}) => {
    const currentUser = useCurrentUser();
    if (userHasOneOfPermissions(permissions, currentUser)) {
        return children;
    }
    return null;
};
