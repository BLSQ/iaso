import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    useRedirectToReplace,
    useSkipEffectOnMount,
} from 'bluesquare-components';
import { DropdownOptions } from 'Iaso/types/utils';
import { commaSeparatedIdsToArray } from '../../../../../../../../hat/assets/js/apps/Iaso/utils/forms';
import { Campaign } from '../../../../constants/types';
import { LqasImUrlParams } from '../../types';
import { LIST } from '../constants';

type UseSelectedRoundsArgs = {
    baseUrl: string;
    campaigns: Campaign[];
    params: LqasImUrlParams;
};

type OnRoundChange = (index: number) => (value: number) => void;

export type UseSelectedRoundsResult = {
    onRoundChange: OnRoundChange;
    selectedRounds: [number | undefined, number | undefined];
    dropDownOptions: DropdownOptions<number>[];
};

export const useSelectedRounds = ({
    baseUrl,
    campaigns,
    params,
}: UseSelectedRoundsArgs): UseSelectedRoundsResult => {
    const { campaign, country, rounds } = params;

    const redirectToReplace = useRedirectToReplace();

    const [selectedRounds, setSelectedRounds] = useState<
        [number | undefined, number | undefined]
    >(rounds ? commaSeparatedIdsToArray(rounds) : [undefined, undefined]);

    const dropDownOptions: DropdownOptions<number>[] = useMemo(() => {
        return campaigns
            ?.filter(c => c.obr_name === campaign)[0]
            ?.rounds.filter(r => !r.on_hold)
            .sort((a, b) => a.number - b.number)
            .map(r => {
                return {
                    label: `Round ${r.number}`,
                    value: r.number,
                };
            });
    }, [campaign, campaigns]);

    const onRoundChange: OnRoundChange = useCallback(
        index => value => {
            const updatedSelection: [number | undefined, number | undefined] = [
                ...selectedRounds,
            ];
            updatedSelection[index] = value;
            setSelectedRounds(updatedSelection);
            redirectToReplace(baseUrl, {
                ...params,
                rounds: updatedSelection.join(','),
            });
        },
        [baseUrl, params, redirectToReplace, selectedRounds],
    );

    useSkipEffectOnMount(() => {
        setSelectedRounds([undefined, undefined]);
    }, [country]);

    useEffect(() => {
        if (dropDownOptions && !rounds) {
            if (dropDownOptions.length === 0) {
                setSelectedRounds([undefined, undefined]);
            }
            if (dropDownOptions.length === 1) {
                setSelectedRounds([
                    dropDownOptions[0].value,
                    dropDownOptions[0].value,
                ]);
                redirectToReplace(baseUrl, {
                    ...params,
                    rounds: `${dropDownOptions[0].value},${dropDownOptions[0].value}`,
                    rightTab: LIST,
                });
            }
            if (dropDownOptions.length > 1) {
                setSelectedRounds([
                    dropDownOptions[0].value,
                    dropDownOptions[1].value,
                ]);
            }
        }
    }, [dropDownOptions, campaign, rounds, redirectToReplace, params, baseUrl]);

    return useMemo(() => {
        return {
            onRoundChange,
            selectedRounds,
            dropDownOptions,
        };
    }, [dropDownOptions, onRoundChange, selectedRounds]);
};
