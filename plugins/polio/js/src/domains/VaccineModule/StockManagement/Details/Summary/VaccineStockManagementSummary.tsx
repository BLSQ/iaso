import React, { FunctionComponent } from 'react';
import { Table, TableBody } from '@mui/material';
import { makeStyles } from '@mui/styles';
import { useSafeIntl } from 'bluesquare-components';
import classnames from 'classnames';
import { PaperTableRow } from '../../../../../../../../../hat/assets/js/apps/Iaso/components/tables/PaperTableRow';
import WidgetPaper from '../../../../../../../../../hat/assets/js/apps/Iaso/components/papers/WidgetPaperComponent';
import MESSAGES from '../../messages';

const useStyles = makeStyles({
    table: {
        '& .MuiTable-root': {
            width: '100%',
        },
    },
});

type Props = { isLoading: boolean; data: any };

export const VaccineStockManagementSummary: FunctionComponent<Props> = ({
    isLoading,
    data,
}) => {
    const classes: Record<string, string> = useStyles();
    const { formatMessage } = useSafeIntl();
    return (
        <WidgetPaper
            className={classnames(classes.table)}
            title={formatMessage(MESSAGES.stockBalance)}
        >
            <Table size="small">
                <TableBody>
                    <PaperTableRow
                        label={formatMessage(MESSAGES.usableVials)}
                        value={data?.total_usable_vials}
                        isLoading={isLoading}
                    />
                    <PaperTableRow
                        label={formatMessage(MESSAGES.unusableVials)}
                        value={data?.total_unusable_vials}
                        isLoading={isLoading}
                    />
                    <PaperTableRow
                        label={formatMessage(MESSAGES.usableDoses)}
                        value={data?.total_usable_doses}
                        isLoading={isLoading}
                    />
                    <PaperTableRow
                        label={formatMessage(MESSAGES.unusableDoses)}
                        value={data?.total_unusable_doses}
                        isLoading={isLoading}
                    />
                </TableBody>
            </Table>
        </WidgetPaper>
    );
};
