import React, { FunctionComponent } from 'react';
import { Typography } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import MESSAGES from '../../../../constants/messages';

type Props = {
    formsWithBadRoundNumber: number;
};

export const BadRoundNumbers: FunctionComponent<Props> = ({
    formsWithBadRoundNumber,
}) => {
    const { formatMessage } = useSafeIntl();
    const title = formatMessage(MESSAGES.badRoundNumbers);
    return formsWithBadRoundNumber ? (
        <Typography variant="h6">{`${title}: ${formsWithBadRoundNumber}`}</Typography>
    ) : null;
};
