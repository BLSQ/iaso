import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { paramsConfig } from '../../constants/urls';

export const useParamsObject = (
    baseUrl: string,
): Record<string, string | Record<string, unknown> | undefined> => {
    const params = useParams()['*'] ?? '';
    return useMemo(() => {
        const paramsList = params.split('/');
        // Even indexes are the params key
        // This check is necessary for ambiguous cases.Eg: /order/status/pageSize/20/ where status is also an acceptable param key
        const paramsKeyIndexes = paramsList
            .map((_, index) => index)
            .filter(index => index % 2 === 0);
        const paramsForUrl = paramsConfig[baseUrl];
        const result = {};
        paramsForUrl.forEach(configParam => {
            const index = paramsList.findIndex(param => param === configParam);
            if (index > -1 && paramsKeyIndexes.includes(index)) {
                const paramValue =
                    index + 1 < paramsList.length
                        ? paramsList[index + 1]
                        : undefined;
                result[configParam] = paramValue;
            } else {
                result[configParam] = undefined;
            }
        });

        return result;
    }, [baseUrl, params]);
};
