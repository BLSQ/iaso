import { push, replace } from 'react-router-redux';
// @ts-ignore
import { createUrl } from 'bluesquare-components';

export const redirectTo =
    (key: string, params: Record<string, string> = {}): ((dispatch) => any) =>
    dispatch =>
        dispatch(push(`${key}${createUrl(params, '')}`));

export const redirectToReplace =
    (key: string, params: Record<string, string> = {}): ((dispatch) => any) =>
    dispatch =>
        dispatch(replace(`${key}${createUrl(params, '')}`));
