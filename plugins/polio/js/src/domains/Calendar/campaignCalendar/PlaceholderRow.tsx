import React, { FunctionComponent } from 'react';
import { FormattedMessage } from 'react-intl';
import { TableCell, TableRow } from '@mui/material';

import { useStyles } from './Styles';
import MESSAGES from '../../../constants/messages';
import { colsCount, colSpanTitle } from './constants';
import { useStaticFields } from '../hooks/useStaticFields';

interface PlaceholderRowProps {
    loadingCampaigns: boolean;
}

export const PlaceholderRow: FunctionComponent<PlaceholderRowProps> = ({ loadingCampaigns }) => {
    const classes = useStyles();
    const fields = useStaticFields();
    return (
        <TableRow className={classes.tableRow}>
            <TableCell
                className={classes.noCampaign}
                colSpan={colsCount * 7 + fields.length * colSpanTitle}
            >
                {!loadingCampaigns && (
                    <FormattedMessage {...MESSAGES.noCampaign} />
                )}
            </TableCell>
        </TableRow>
    );
};

