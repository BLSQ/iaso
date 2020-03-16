import { push } from 'react-router-redux';
import { createUrl } from '../../../utils/fetchData';


export function redirectTo(key, params) {
    return dispatch => (
        dispatch(push(`${key}${createUrl(params, '')}`))
    );
}
