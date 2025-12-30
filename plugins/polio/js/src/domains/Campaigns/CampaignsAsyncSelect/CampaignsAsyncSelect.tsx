import React, { FunctionComponent, useCallback, useMemo } from 'react';
import { getRequest, IntlMessage } from 'bluesquare-components';
import { AsyncSelect } from 'Iaso/components/forms/AsyncSelect';
import MESSAGES from '../../../constants/messages';
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
import { useAsyncInitialState } from 'Iaso/hooks/useAsyncInitialState';
import { useCampaignTypeNames } from './useCampaignTypeNames';

type Props = {
    handleChange: (keyValue: string, value: unknown) => void;
    label?: IntlMessage;
    multi?: boolean;
    keyValue?: string;
    clearable?: boolean;
    initialValue?: string; // obr name
    onHold?: boolean;
    showTest?: boolean;
    showPlanned?: boolean;
    campaignCategory?: CampaignCategory;
    campaignType?: 'polio' | 'non-polio' | string;
};

export const CampaignAsyncSelect: FunctionComponent<Props> = ({
    keyValue = 'campaigns',
    handleChange,
    multi,
    clearable,
    initialValue,
    campaignCategory = 'regular' as CampaignCategory,
    onHold = true,
    showPlanned = true,
    showTest = false,
    campaignType = 'polio',
}) => {
    const campaignTypes = useCampaignTypeNames(campaignType);
    const [search, setSearch, isStateSet] = useAsyncInitialState<
        string | undefined
    >(initialValue);

    const baseOptions = useMemo(() => {
        return {
            fieldset: 'dropdown',
            campaignCategory,
            on_hold: onHold,
            is_planned: showPlanned,
            show_test: showTest,
        };
    }, [campaignCategory, onHold, showPlanned, showTest]);
    const options: Options = useMemo(() => {
        return {
            enabled: isStateSet,
            campaignType: campaignTypes,
            search,
            ...baseOptions,
        };
    }, [campaignTypes, search]);

    const fetchOptions = useCallback(
        async (query: string): Promise<any[]> => {
            const campaignOptions = makeCampaignOptions({
                search: query,
                ...baseOptions,
                campaignType: campaignTypes,
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
        [campaignTypes],
    );

    const { data: selectedCampaigns } = useGetCampaigns(
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
    }, [selectedCampaigns]);

    const handleChangeCampaigns = useCallback(
        (keyValue, newValue) => {
            const val = multi
                ? newValue?.map(r => r.label)?.join(',') // using label i.o value to get the obr name
                : newValue;
            setSearch(val?.label ? val.label : undefined);
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
