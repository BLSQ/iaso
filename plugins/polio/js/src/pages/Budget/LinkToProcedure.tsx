import React, { FunctionComponent } from 'react';
import { Link } from 'react-router';
// @ts-ignore
import { useSafeIntl } from 'bluesquare-components';
import { Typography } from '@material-ui/core';
import { WHO_AFRO_PROCEDURE } from './constants';
import MESSAGES from '../../constants/messages';

export const LinkToProcedure: FunctionComponent = () => {
    const { formatMessage } = useSafeIntl();

    return (
        <Link href={WHO_AFRO_PROCEDURE} target="_blank">
            <Typography
                style={{
                    //  @ts-ignore
                    wordWrap: 'anywhere',
                }}
            >
                {formatMessage(MESSAGES.seeProcedure)}
            </Typography>
        </Link>
    );
};
