// import { useDispatch } from 'react-redux';
import { redirectToReplace } from '../routing/actions';
import { dispatch } from '../redux/store';

export const handleTableDeepLink = baseUrl => {
    // const dispatch = useDispatch();
    return newParams => {
        dispatch(redirectToReplace(baseUrl, newParams));
    };
};
