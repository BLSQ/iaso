import React, { FunctionComponent } from 'react';
import { useSafeIntl } from 'bluesquare-components';
import { Typography } from '@mui/material';
import MESSAGES from '../../../constants/messages';

type Props = {
    // eslint-disable-next-line react/require-default-props
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
