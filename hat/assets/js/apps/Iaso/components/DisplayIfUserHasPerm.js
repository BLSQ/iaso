import PropTypes from 'prop-types';
import { userHasPermission } from '../domains/users/utils';
import { useCurrentUser } from '../utils/usersUtils.ts';

export const DisplayIfUserHasPerm = ({ permission, children }) => {
    const currentUser = useCurrentUser();
    if (userHasPermission(permission, currentUser)) {
        return children;
    }
    return null;
};

DisplayIfUserHasPerm.propTypes = {
    permission: PropTypes.string.isRequired,
};
