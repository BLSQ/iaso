// @ts-ignore
import { useSkipEffectOnMount } from 'bluesquare-components';
import { useState } from 'react';
import { convertObjectToString } from '../utils';

type Params = {
    params: Record<string, any>;
};

export const useResetPageToOne = ({ params }: Params): string => {
    const { campaignName, campaignId } = params;
    const [resetPageToOne, setResetPageToOne] = useState<string>('');

    useSkipEffectOnMount(() => {
        const newParams = {
            ...params,
        };
        delete newParams.page;
        delete newParams.order;
        setResetPageToOne(convertObjectToString(newParams));
    }, [params.pageSize, campaignId, campaignName]);

    return resetPageToOne;
};
