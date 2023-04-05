import { redirectToReplace } from '../routing/actions';
import { dispatch } from '../redux/store';

export const handleTableDeepLink = (baseUrl: string) => {
    return newParams => {
        dispatch(redirectToReplace(baseUrl, newParams));
    };
};
