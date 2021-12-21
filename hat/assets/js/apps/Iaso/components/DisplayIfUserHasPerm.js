import { useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import { userHasPermission } from '../domains/users/utils';

export const DisplayIfUserHasPerm = ({ permission, children }) => {
    const currentUser = useSelector(state => state.users.current);
    if (userHasPermission(permission, currentUser)) {
        return children;
    }
    return null;
};

DisplayIfUserHasPerm.propTypes = {
    permission: PropTypes.string.isRequired,
};
