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
import { RowArray } from './RowArray';
import { LogStructure } from './constants';

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

    console.log('campaign log detail', campaignLogDetail);
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
                            <TableCell
                                width={150}
                                className={classes.tableCellHead}
                            >
                                {formatMessage(MESSAGES.value)}
                            </TableCell>
                        </TableRow>
                    </TableHead>

                    <TableBody>
                        {LogStructure.map(
                            ({
                                type,
                                getLogValue,
                                key,
                                children,
                                childrenLabel,
                            }) => {
                                if (type === 'array' && children) {
                                    return (
                                        <RowArray
                                            key={key}
                                            logKey={key}
                                            logDetail={campaignLogDetail}
                                            childrenArray={children}
                                            childrenLabel={childrenLabel}
                                        />
                                    );
                                }

                                return (
                                    <Row
                                        key={key}
                                        value={
                                            getLogValue
                                                ? getLogValue(campaignLogDetail)
                                                : campaignLogDetail[key]
                                        }
                                        fieldKey={key}
                                    />
                                );
                            },
                        )}
                    </TableBody>
                </Table>
            )}
        </>
    );
};
