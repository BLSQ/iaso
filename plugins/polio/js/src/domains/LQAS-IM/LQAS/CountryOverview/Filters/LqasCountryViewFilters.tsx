import React, { FunctionComponent, useCallback, useState } from 'react';
import { LqasUrlParams } from '../..';
import { Side } from '../../../../../constants/types';
import { LqasFilterByCountry } from './LqasFilterByCountry';
import { LqasFilterByDate } from './LqasFilterByDate';
import { useRedirectToReplace, useSafeIntl } from 'bluesquare-components';
import { Box, FormControlLabel, FormGroup, Grid, Switch } from '@mui/material';
import MESSAGES from '../../../../../constants/messages';

type FilterType = 'country' | 'date';

type Props = {
    isFetching: boolean;
    params: LqasUrlParams;
    side: Side;
    isEmbedded: boolean;
    currentUrl: string;
};

const emptyParams = {
    left: {
        leftCountry: undefined,
        leftCampaign: undefined,
        leftRound: undefined,
        leftMonth: undefined,
        leftYear: undefined,
        leftTab: undefined,
    },
    right: {
        rightCampaign: undefined,
        rightCountry: undefined,
        rightRound: undefined,
        rightMonth: undefined,
        rightYear: undefined,
        rightTab: undefined,
    },
};

export const LqasCountryViewFilters: FunctionComponent<Props> = ({
    params,
    side,
    isEmbedded,
    isFetching,
    currentUrl,
}) => {
    const { formatMessage } = useSafeIntl();
    const [classicModeOn, setClassicModeOn] = useState<boolean>(
        params[`${side}FilterType`] === 'country',
    );
    const redirectToReplace = useRedirectToReplace();

    const toggleClassicMode = useCallback(() => {
        setClassicModeOn(!classicModeOn);
        const newParams = {
            ...params,
            ...emptyParams[side],
            [`${side}FilterType`]: !classicModeOn ? 'country' : 'date',
        };
        redirectToReplace(currentUrl, newParams);
    }, [redirectToReplace, currentUrl, classicModeOn]);

    return (
        <Box>
            <FormGroup>
                <FormControlLabel
                    style={{ width: 'max-content' }}
                    control={
                        <Switch
                            size="medium"
                            checked={classicModeOn}
                            onChange={toggleClassicMode}
                            color="primary"
                        />
                    }
                    label={formatMessage(MESSAGES.classicFilters)}
                />
            </FormGroup>
            {classicModeOn && (
                <LqasFilterByCountry
                    side={side}
                    params={params}
                    isFetching={isFetching}
                    isEmbedded={isEmbedded}
                />
            )}
            {!classicModeOn && (
                <LqasFilterByDate
                    side={side}
                    params={params}
                    currentUrl={currentUrl}
                    isEmbedded={isEmbedded}
                />
            )}
        </Box>
    );
};
