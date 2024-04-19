import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { paramsConfig } from '../../constants/urls';

const emptyObject = {};

export const useParamsObject = (
    baseUrl: string,
): Record<string, string | Record<string, unknown>> => {
    const params = useParams()['*'];
    return useMemo(() => {
        if (!params) return emptyObject;
        const paramsList = params.split('/');
        const paramsForUrl = paramsConfig[baseUrl];
        const result = {};
        // This assumes we can never have a param value equal to a param key, eg, /pageSize/20/otherParam/pageSize
        paramsForUrl.forEach(configParam => {
            const index = paramsList.findIndex(param => param === configParam);
            if (index > -1) {
                result[configParam] =
                    index + 1 < paramsList.length
                        ? paramsList[index + 1]
                        : undefined;
            } else {
                result[configParam] = undefined;
            }
        });
        return result;
    }, [baseUrl, params]);
};
