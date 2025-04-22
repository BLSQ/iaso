import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    useRedirectToReplace,
    useSkipEffectOnMount,
} from 'bluesquare-components';
import { commaSeparatedIdsToArray } from '../../../../../../../../hat/assets/js/apps/Iaso/utils/forms';
import { LIST } from '../constants';

export const useSelectedRounds = ({ baseUrl, campaigns, params }) => {
    const { campaign, country, rounds } = params;
    const round_values = rounds
        ? rounds
              ?.split(',')
              ?.filter(
                  r => r in (campaign?.rounds?.filter(rc => !rc.on_hold) || []),
              )
              .join(',')
        : rounds;

    const redirectToReplace = useRedirectToReplace();

    const [selectedRounds, setSelectedRounds] = useState(
        round_values
            ? commaSeparatedIdsToArray(round_values)
            : [undefined, undefined],
    );

    const dropDownOptions = useMemo(() => {
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

    const onRoundChange = useCallback(
        index => value => {
            const updatedSelection = [...selectedRounds];
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
    }, [
        dropDownOptions,
        campaign,
        rounds,
        redirectToReplace,
        params,
        baseUrl,
        round_values,
    ]);

    return useMemo(() => {
        return {
            onRoundChange,
            selectedRounds,
            dropDownOptions,
        };
    }, [dropDownOptions, onRoundChange, selectedRounds]);
};
