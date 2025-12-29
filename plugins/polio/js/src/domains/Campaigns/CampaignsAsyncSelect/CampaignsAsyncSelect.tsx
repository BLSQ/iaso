import React, {
    FunctionComponent,
    useCallback,
    useMemo,
    useState,
} from 'react';
import { getRequest, IntlMessage } from 'bluesquare-components';
import { AsyncSelect } from 'Iaso/components/forms/AsyncSelect';
import MESSAGES from '../../../constants/messages';
import { useGetCampaignTypes } from '../hooks/api/useGetCampaignTypes';
import {
    CampaignCategory,
    CAMPAIGNS_ENDPOINT,
    getURL,
    makeCampaignOptions,
    Options,
    useGetCampaigns,
} from '../hooks/api/useGetCampaigns';
import { openSnackBar } from 'Iaso/components/snackBars/EventDispatcher';
import { errorSnackBar } from 'Iaso/constants/snackBars';
import { Campaign } from '../../../constants/types';

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
            try {
                const searchResult = await getRequest(url);
                const result = searchResult.map(option => ({
                    label: option.obr_name,
                    value: option.id,
                    campaign_types: option.campaign_types,
                }));
                return result;
            } catch (e) {
                openSnackBar(errorSnackBar(undefined, MESSAGES.error, e));
                return [];
            }
        },
        [nonPolioTypes],
    );

    const { data: selectedCampaigns, isFetched } = useGetCampaigns(
        options,
        CAMPAIGNS_ENDPOINT,
        undefined,
        { keepPreviousData: false },
    );

    const campaignOptions = useMemo(() => {
        return (
            (selectedCampaigns as Campaign[])?.map(selected => ({
                label: selected.obr_name,
                value: selected.id,
                campaign_types: selected.campaign_types,
            })) ?? []
        );
    }, [selectedCampaigns, isFetched]);

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
            value={campaignOptions ?? ''}
            onChange={handleChangeCampaigns}
            debounceTime={500}
            multi={multi}
            clearable={clearable}
            fetchOptions={input => fetchOptions(input)}
        />
    );
};
