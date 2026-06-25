import React from 'react';
import { UrlParams } from 'bluesquare-components';
import { useApiDiffInstancesList } from 'Iaso/api/instanceDiff';
import { baseUrls } from 'Iaso/constants/urls';
import { useParamsObject } from 'Iaso/routing/hooks/useParamsObject';
import { InstanceDetailRaw } from '../compare/components/InstanceDetailRaw';
import { InstanceValidationWidgetPaper } from '../components/ValidationWorkflow/InstanceValidationWidgetPaper';
import { useGetInstance } from '../hooks/requests/useGetInstance';

type Params = {
    accountId: string;
    instanceId: string;
} & Partial<UrlParams>;

const diffParams = {
    limit: 2,
    page: 1,
    order: '-created_at',
};

export const ValidateInstance = () => {
    const params: Params = useParamsObject(
        baseUrls.instanceValidation,
    ) as Params;

    const { data: instance } = useGetInstance(params.instanceId, {
        cacheTime: Infinity,
        staleTime: Infinity,
    });
    const { data, isLoading, isError } = useApiDiffInstancesList(
        params.instanceId,
        diffParams,
    );
    console.log('PARAMS', params);
    console.log('DATA', data);
    console.log('INSTANCE', instance);
    return (
        <>
            <InstanceDetailRaw
                data={instance}
                isLoading={isLoading}
                isError={isError}
                showTitle
            />
            {instance && (
                <InstanceValidationWidgetPaper
                    currentInstanceId={instance?.id}
                />
            )}
        </>
    );
};
