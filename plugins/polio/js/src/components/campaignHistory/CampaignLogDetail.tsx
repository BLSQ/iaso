/* eslint-disable camelcase */
import React, { FunctionComponent } from 'react';
// @ts-ignore,
import {
    useSafeIntl,
    LoadingSpinner,
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

import MESSAGES from '../../constants/messages';

type Props = {
    logId: string | undefined;
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
        data?: Record<string, any> | undefined;
        isLoading: boolean;
        isError: boolean;
    } = useGetCampaignLogDetail(logId);

    const { formatMessage } = useSafeIntl();

    const classes: Record<string, string> = useStyles();

    // const getValue = (valueType, value) => {
    //     switch (valueType) {
    //         // iterate inside rounds object and show keys/values. Create a section "rounds" ? like in instance detail
    //         case 'object':
    //             return 'TO DO';

    //         case 'boolean':
    //             return value.toString();

    //         default:
    //             return value;
    //     }
    // };

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

    console.log('campaign log details', campaignLogDetail)

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
                                {formatMessage(MESSAGES.key)}
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
                                if (value !== null) {
                                    return (
                                        <TableRow key={key}>
                                            <TableCell
                                                width={150}
                                                className={classes.tableCell}
                                            >
                                                {key}
                                            </TableCell>
                                            <TableCell
                                                width={150}
                                                className={classes.tableCell}
                                            >
                                                {getValue(key, campaignLogDetail, typeof value)}
                                            </TableCell>
                                        </TableRow>
                                    );
                                }

                                return undefined;
                            },
                        )}
                    </TableBody>
                </Table>
            )}
        </>
    );
};
