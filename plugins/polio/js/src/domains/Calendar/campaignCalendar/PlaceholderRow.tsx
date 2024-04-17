import { TableCell, TableRow } from '@mui/material';
import React, { FunctionComponent } from 'react';

import { useSafeIntl } from 'bluesquare-components';
import { SxStyles } from '../../../../../../../hat/assets/js/apps/Iaso/types/general';
import MESSAGES from '../../../constants/messages';
import { useStaticFields } from '../hooks/useStaticFields';
import { colsCounts, colSpanTitle } from './constants';
import { cellHeight } from './Styles';
import { CalendarParams } from './types';

interface PlaceholderRowProps {
    loadingCampaigns: boolean;
    params: CalendarParams;
}

const styles: SxStyles = {
    noCampaign: {
        textAlign: 'center',
        borderLeft: theme =>
            // @ts-ignore
            `1px solid ${theme.palette.ligthGray.border}`,
    },
    tableRow: {
        height: cellHeight,
        '& th:last-child, & td:last-child': {
            // @ts-ignore
            borderRight: theme => `1px solid ${theme.palette.ligthGray.border}`,
        },
    },
};

export const PlaceholderRow: FunctionComponent<PlaceholderRowProps> = ({
    loadingCampaigns,
    params,
}) => {
    const fields = useStaticFields();
    const { formatMessage } = useSafeIntl();
    return (
        <TableRow sx={styles.tableRow}>
            <TableCell
                sx={styles.noCampaign}
                colSpan={
                    colsCounts[params.periodType || 'quarter'] * 7 +
                    fields.length * colSpanTitle
                }
            >
                {!loadingCampaigns && formatMessage(MESSAGES.noCampaign)}
            </TableCell>
        </TableRow>
    );
};
