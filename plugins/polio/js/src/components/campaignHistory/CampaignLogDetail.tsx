/* eslint-disable camelcase */
import React, { FunctionComponent } from 'react';
import {
    // @ts-ignore
    useSafeIntl,
    // @ts-ignore
    LoadingSpinner,
    // @ts-ignore
    commonStyles,
} from 'bluesquare-components';

import {
    Box,
    Table,
    TableHead,
    TableBody,
    TableRow,
    TableCell,
    makeStyles,
    Theme,
} from '@material-ui/core';

import { useGetCampaignLogDetail } from '../../hooks/useGetCampaignHistory';
import { useGetCampaignFieldValue } from '../../hooks/useGetCampaignFieldValue';

import ErrorPaperComponent from '../../../../../../hat/assets/js/apps/Iaso/components/papers/ErrorPaperComponent';

import { CampaignLogData } from '../../constants/types';

import MESSAGES from '../../constants/messages';
import { useGetCampaignFieldLabel } from '../../hooks/useGetCampaignFieldLabel';

type Props = {
    logId?: string;
};

const useStyles = makeStyles((theme: Theme) => ({
    ...commonStyles(theme),
    tableCellHead: {
        fontWeight: 'bold',
    },
}));

export const CampaignLogDetail: FunctionComponent<Props> = ({ logId }) => {
    const {
        data: campaignLogDetail,
        isLoading,
        isError,
    }: {
        data?: CampaignLogData;
        isLoading: boolean;
        isError: boolean;
    } = useGetCampaignLogDetail(logId);

    const { formatMessage } = useSafeIntl();

    const classes: Record<string, string> = useStyles();

    const getLabel = useGetCampaignFieldLabel();
    const getValue = useGetCampaignFieldValue();

    if (isLoading)
        return (
            <Box height="70vh">
                <LoadingSpinner
                    fixed={false}
                    transparent
                    padding={4}
                    size={25}
                />
            </Box>
        );
    if (isError) {
        return <ErrorPaperComponent message={formatMessage(MESSAGES.error)} />;
    }

    return (
        <>
            {campaignLogDetail && (
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell
                                width={150}
                                className={classes.tableCellHead}
                            >
                                {formatMessage(MESSAGES.label)}
                            </TableCell>
                            <TableCell
                                width={150}
                                className={classes.tableCellHead}
                            >
                                {formatMessage(MESSAGES.value)}
                            </TableCell>
                        </TableRow>
                    </TableHead>

                    <TableBody>
                        {Object.entries(campaignLogDetail).map(
                            ([key, value]) => {
                                return (
                                    <TableRow key={key}>
                                        <TableCell
                                            width={150}
                                            className={classes.tableCell}
                                        >
                                            {getLabel(key, MESSAGES)}
                                        </TableCell>
                                        <TableCell
                                            width={150}
                                            className={classes.tableCell}
                                        >
                                            {getValue(
                                                key,
                                                campaignLogDetail,
                                                typeof value,
                                            )}
                                        </TableCell>
                                    </TableRow>
                                );
                            },
                        )}
                    </TableBody>
                </Table>
            )}
        </>
    );
};
