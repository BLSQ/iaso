import { push } from 'react-router-redux';
import { createUrl } from '../../../utils/fetchData';


// eslint-disable-next-line import/prefer-default-export
export function redirectTo(key, params) {
    return dispatch => (
        dispatch(push(`${key}${createUrl(params, '')}`))
    );
}
