import React, { FunctionComponent } from 'react';
import { useSafeIntl } from 'bluesquare-components';
import { Typography } from '@material-ui/core';
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
    return (
        <>
            <Typography variant="h6">{`${title}: ${formsWithBadRoundNumber}`}</Typography>
        </>
    );
};
