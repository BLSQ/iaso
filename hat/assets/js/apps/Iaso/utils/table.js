// import { useDispatch } from 'react-redux';
import { useDispatch } from 'react-redux';
import { redirectToReplace } from '../routing/actions';
// import { dispatch } from '../redux/store';

export const handleTableDeepLink = () => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const dispatch = useDispatch();
    return (baseUrl, newParams) => {
        console.log('handleDeepLink', newParams);
        dispatch(redirectToReplace(baseUrl, newParams));
    };
};
