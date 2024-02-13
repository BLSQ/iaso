/* eslint-disable camelcase */
import React, { FunctionComponent } from 'react';
import { TableCell, TableRow } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import MESSAGES from '../../messages';
import { SxStyles } from '../../../../../types/general';

type Props = {
    fieldKey: string;
    value: string;
};

const styles: SxStyles = {
    textColor: theme => ({
        color: `${theme.palette.error.main} !important`,
        verticalAlign: 'top',
    }),

    labelCell: {
        verticalAlign: 'top',
        width: '5vw',
    },
};

export const ReviewOrgUnitChangeDetailsPlaceholderRow: FunctionComponent<Props> =
    ({ fieldKey, value }) => {
        const { formatMessage } = useSafeIntl();
        return (
            <TableRow key={fieldKey}>
                <TableCell sx={styles.labelCell}>{value}</TableCell>

                <TableCell sx={styles.textColor}>
                    {formatMessage(MESSAGES.requiredField)}
                </TableCell>
                <TableCell />
            </TableRow>
        );
    };
