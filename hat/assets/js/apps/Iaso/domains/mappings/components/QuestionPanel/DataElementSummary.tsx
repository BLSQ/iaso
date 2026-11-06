import React, { FunctionComponent } from 'react';
import { Dataset } from '@mui/icons-material';
import { Box, Typography } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import MESSAGES from '../../messages';
import { ChipItem, ChipsRow } from './ChipsRow';
import { LabeledValue } from './LabeledValue';
import {
    emptyValue,
    nameOrId,
    summaryStyles,
    SummaryItemProps,
} from './summaryUtils';

const MAX_VISIBLE_DATASETS = 2;

type DataSet = { id: string; name?: string; periodType?: string };

const getDataSetChips = (item: Record<string, any>): ChipItem[] =>
    (item.dataSetElements ?? [])
        .map((element: { dataSet?: DataSet }) => element.dataSet)
        .filter(Boolean)
        .map((dataSet: DataSet) => ({
            key: dataSet.id,
            label: dataSet.name ?? dataSet.id,
            title: [dataSet.name, dataSet.periodType, dataSet.id]
                .filter(Boolean)
                .join(' - '),
            icon: <Dataset />,
        }));

// AGGREGATE / EVENT mapping: { id, valueType, categoryOptionCombo, ... }
export const DataElementSummary: FunctionComponent<SummaryItemProps> = ({
    item,
    emptyLabel,
}) => {
    const { formatMessage } = useSafeIntl();
    const dataSets = getDataSetChips(item);
    return (
        <Box sx={summaryStyles.item}>
            <LabeledValue
                label={formatMessage(MESSAGES.dataElement)}
                value={nameOrId(item) ?? emptyValue(emptyLabel)}
                dhis2Id={(item.displayName ?? item.name) ? item.id : undefined}
                reserveIdLine
                large
            />
            <Box sx={summaryStyles.fields}>
                <LabeledValue
                    label={formatMessage(MESSAGES.valueType)}
                    value={item.valueType}
                />
                <LabeledValue
                    label={formatMessage(MESSAGES.domainType)}
                    value={item.domainType}
                />
                <LabeledValue
                    label={formatMessage(MESSAGES.categoryOptionCombo)}
                    value={
                        item.categoryOptionComboName ?? item.categoryOptionCombo
                    }
                    dhis2Id={
                        item.categoryOptionComboName
                            ? item.categoryOptionCombo
                            : undefined
                    }
                    reserveIdLine
                />
            </Box>
            <Box>
                <Typography variant="caption" color="textSecondary">
                    {dataSets.length > 0
                        ? `${formatMessage(MESSAGES.datasets)} (${dataSets.length})`
                        : formatMessage(MESSAGES.datasets)}
                </Typography>
                <ChipsRow items={dataSets} maxVisible={MAX_VISIBLE_DATASETS} />
            </Box>
        </Box>
    );
};
