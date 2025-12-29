import React, {
    FunctionComponent,
    useCallback,
    useMemo,
    useState,
} from 'react';
import { getRequest, IntlMessage } from 'bluesquare-components';

import { AsyncSelect } from 'Iaso/components/forms/AsyncSelect';
import MESSAGES from '../../../constants/messages';
import { makeUrlWithParams } from 'Iaso/libs/utils';
import { useGetCampaignTypes } from '../hooks/api/useGetCampaignTypes';
import {
    CampaignCategory,
    CAMPAIGNS_ENDPOINT,
    GetCampaignsParams,
    getURL,
    makeCampaignOptions,
    Options,
    useGetCampaigns,
    useGetCampaignsOptions,
} from '../hooks/api/useGetCampaigns';

const baseOptions = {
    fieldset: 'dropdown',
    campaignCategory: 'regular' as CampaignCategory,
    on_hold: true,
    is_planned: true,
    show_test: false,
};

type Props = {
    handleChange: (keyValue: string, value: unknown) => void;
    label?: IntlMessage;
    multi?: boolean;
    keyValue?: string;
    clearable?: boolean;
};

export const CampaignAsyncSelect: FunctionComponent<Props> = ({
    keyValue = 'campaigns',
    handleChange,
    multi,
    clearable,
}) => {
    const { data: types } = useGetCampaignTypes();
    const [search, setSearch] = useState();
    const nonPolioTypes = (types ?? [])
        .filter(typeOption => typeOption.value !== 'polio')
        .map(typeOption => typeOption.value)
        .join(',');

    const options: Options = useMemo(() => {
        return {
            enabled: Boolean(search),
            campaignType: nonPolioTypes,
            search,
            ...baseOptions,
        };
    }, [nonPolioTypes, search]);

    const fetchOptions = useCallback(
        async (query: string): Promise<any[]> => {
            const campaignOptions = makeCampaignOptions({
                search: query,
                ...baseOptions,
                campaignType: nonPolioTypes,
            });
            const url = getURL(campaignOptions, CAMPAIGNS_ENDPOINT);

            return getRequest(url);
        },
        [nonPolioTypes],
    );

    const { data: selectedCampaigns, isFetching } = useGetCampaigns(
        options,
        CAMPAIGNS_ENDPOINT,
        undefined,
        { keepPreviousData: false },
    );

    const handleChangeCampaigns = useCallback(
        (keyValue, newValue) => {
            const val = multi
                ? newValue?.map(r => r.label)?.join(',') // using label i.o value to get the obr name
                : newValue;
            setSearch(val.label ? val.label : undefined);
            handleChange(keyValue, val ? val : undefined);
        },
        [handleChange],
    );

    return (
        <AsyncSelect
            keyValue={keyValue}
            label={MESSAGES.campaign}
            value={selectedCampaigns ?? ''}
            onChange={handleChangeCampaigns}
            debounceTime={500}
            multi={multi}
            clearable={clearable}
            fetchOptions={input => fetchOptions(input)}
        />
    );
};
