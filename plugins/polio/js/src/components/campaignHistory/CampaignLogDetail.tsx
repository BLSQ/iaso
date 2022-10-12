/* eslint-disable camelcase */
import React, { FunctionComponent, useMemo } from 'react';
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
    Typography,
} from '@material-ui/core';

import { useGetCampaignLogDetail } from '../../hooks/useGetCampaignHistory';
import { useGetCampaignFieldValue } from '../../hooks/useGetCampaignFieldValue';

import ErrorPaperComponent from '../../../../../../hat/assets/js/apps/Iaso/components/papers/ErrorPaperComponent';

import { CampaignLogData } from '../../constants/types';
import { Profile } from '../../../../../../hat/assets/js/apps/Iaso/utils/usersUtils';

import MESSAGES from '../../constants/messages';
import { useGetCampaignFieldLabel } from '../../hooks/useGetCampaignFieldLabel';
import { baseUrls } from '../../../../../../hat/assets/js/apps/Iaso/constants/urls';

type Props = {
    logId?: string;
};

export type Result = {
    user: Profile;
    logDetail: CampaignLogData;
};

const useStyles = makeStyles((theme: Theme) => ({
    ...commonStyles(theme),
    tableCellHead: {
        fontWeight: 'bold',
    },
    linkToChangesLog: {
        color: theme.palette.primary.main,
        textAlign: 'right',
        flex: '1',
        cursor: 'pointer',
    },
}));

const redirectToChangesLog = url => {
    window.open(url);
};

export const CampaignLogDetail: FunctionComponent<Props> = ({ logId }) => {
    const {
        data,
        isLoading,
        isError,
    }: {
        data?: Result | undefined;
        isLoading: boolean;
        isError: boolean;
    } = useGetCampaignLogDetail(logId);

    const { logDetail: campaignLogDetail } = useMemo(() => {
        if (!data) {
            return { logDetail: undefined };
        }

        return data;
    }, [data]);

    const logsUrl = `/${baseUrls.apiLogs}/${logId}`;

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
                                            {value ? (
                                                getValue(
                                                    key,
                                                    campaignLogDetail,
                                                    typeof value,
                                                )
                                            ) : (
                                                <Typography
                                                    className={
                                                        classes.linkToChangesLog
                                                    }
                                                    variant="overline"
                                                    onClick={() =>
                                                        redirectToChangesLog(
                                                            logsUrl,
                                                        )
                                                    }
                                                >
                                                    {formatMessage(
                                                        MESSAGES.seeLogDetail,
                                                    )}
                                                </Typography>
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
