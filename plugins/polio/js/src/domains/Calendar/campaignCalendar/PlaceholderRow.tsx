import { TableCell, TableRow } from '@mui/material';
import React, { FunctionComponent } from 'react';

import { useSafeIntl } from 'bluesquare-components';
import MESSAGES from '../../../constants/messages';
import { useStaticFields } from '../hooks/useStaticFields';
import { colsCount, colSpanTitle } from './constants';
import { useStyles } from './Styles';

interface PlaceholderRowProps {
    loadingCampaigns: boolean;
}

export const PlaceholderRow: FunctionComponent<PlaceholderRowProps> = ({
    loadingCampaigns,
}) => {
    const classes = useStyles();
    const fields = useStaticFields();
    const { formatMessage } = useSafeIntl();
    return (
        <TableRow className={classes.tableRow}>
            <TableCell
                className={classes.noCampaign}
                colSpan={colsCount * 7 + fields.length * colSpanTitle}
            >
                {!loadingCampaigns && formatMessage(MESSAGES.noCampaign)}
            </TableCell>
        </TableRow>
    );
};
