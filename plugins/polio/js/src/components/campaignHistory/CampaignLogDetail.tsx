/* eslint-disable camelcase */
import React, { FunctionComponent, useMemo } from 'react';
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

import { CampaignLogData } from '../../constants/types';
import { Profile } from '../../../../../../hat/assets/js/apps/Iaso/utils/usersUtils';

import MESSAGES from '../../constants/messages';
import { useGetCampaignFieldLabel } from '../../hooks/useGetCampaignFieldLabel';

import { Row } from './Row';
import { logStructure } from './constants';
import { mapLogStructure } from './mapStructure';

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

const objectLoop = (obj, getValue, getLabel) => {
    return (
        <Table size="small">
            <TableBody>
                {Object.entries(obj).map(([key, value], index) => (
                    <Row
                        key={`${key}-${index}`}
                        fieldKey={key}
                        value={getComplexValue(value, getValue, key, getLabel)}
                    />
                ))}
            </TableBody>
        </Table>
    );
};

const displayAsStringKeysArray = ['org_units'];

const arrayLoop = (arr, getValue, key, getLabel) => {
    if (displayAsStringKeysArray.includes(key)) {
        return arr.join(', ');
    }
    return (
        <Table size="small">
            <TableBody>
                {arr.map((value, index) => (
                    <Row
                        key={`${key}-${index}`}
                        value={getComplexValue(value, getValue, key, getLabel)}
                    />
                ))}
            </TableBody>
        </Table>
    );
};

const getComplexValue = (value, getValue, key, getLabel) => {
    if (Array.isArray(value)) {
        return arrayLoop(value, getValue, key, getLabel);
    }
    if (value && typeof value === 'object') {
        return objectLoop(value, getValue, getLabel);
    }
    return getValue(value, typeof value);
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
                <Table size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell
                                width={150}
                                className={classes.tableCellHead}
                            >
                                {formatMessage(MESSAGES.label)}
                            </TableCell>
                            <TableCell className={classes.tableCellHead}>
                                {formatMessage(MESSAGES.value)}
                            </TableCell>
                        </TableRow>
                    </TableHead>

                    <TableBody>
                        {mapLogStructure(logStructure, campaignLogDetail)}
                        {/* {Object.entries(campaignLogDetail).map(
                            ([key, value]) => {
                                return (
                                    <Row
                                        key={key}
                                        value={getComplexValue(
                                            value,
                                            getValue,
                                            key,
                                            getLabel,
                                        )}
                                        fieldKey={key}
                                    />
                                );
                            },
                        )} */}
                    </TableBody>
                </Table>
            )}
        </>
    );
};
