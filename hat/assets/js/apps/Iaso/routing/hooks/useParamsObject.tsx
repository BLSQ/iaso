import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { routeConfigsNoElement } from '../../constants/routeParams';

const emptyObject = {};
const getParamsForBaseUrl = (baseUrl: string) => {
    const route = routeConfigsNoElement.find(
        config => config.baseUrl === baseUrl,
    );
    const { params } = route ?? { params: [] };
    return params.map(param => param.key);
};
export const useParamsObject = (
    baseUrl: string,
): Record<string, string | Record<string, unknown>> => {
    const params = useParams()['*'];
    return useMemo(() => {
        if (!params) return emptyObject;
        const paramsList = params.split('/');
        const paramsForUrl = getParamsForBaseUrl(baseUrl);
        const result = {};
        // This assumes we can never have a param value equal to a param key, eg, /pageSize/20/otherParam/pageSize
        paramsForUrl.forEach(configParam => {
            const index = paramsList.findIndex(param => param === configParam);
            if (index > -1) {
                result[paramsList[index]] =
                    index + 1 < paramsList.length
                        ? paramsList[index + 1]
                        : undefined;
            }
        });
        return result;
    }, [baseUrl, params]);
};
