import React, { FunctionComponent } from 'react';
import { Dataset } from '@mui/icons-material';
import { Box, Divider, Typography } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import { SxStyles } from '../../../../types/general';
import MESSAGES from '../../messages';
import { QuestionMapping } from '../../types';
import ObjectDumper from '../ObjectDumper';
import { ChipItem, ChipsRow } from './ChipsRow';
import { LabeledValue } from './LabeledValue';

const styles: SxStyles = {
    item: {
        display: 'flex',
        flexDirection: 'column',
        gap: 1.5,
    },
    // fixed columns, so a missing value doesn't move the others
    fields: {
        display: 'grid',
        gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
        gap: 2,
    },
    separator: {
        my: 2,
    },
    emptyValue: {
        color: 'text.secondary',
    },
};

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

// the name, or the id when the name is not stored
const nameOrId = (target: Record<string, any>) =>
    target.displayName ?? target.name ?? target.id;

type ItemProps = {
    item: Record<string, any>;
    // shown instead of the name when there is no mapping
    emptyLabel?: string;
};

const emptyValue = (label?: string) =>
    label ? (
        <Box component="span" sx={styles.emptyValue}>
            {label}
        </Box>
    ) : undefined;

// AGGREGATE / EVENT mapping: { id, valueType, categoryOptionCombo, ... }
const DataElementSummary: FunctionComponent<ItemProps> = ({
    item,
    emptyLabel,
}) => {
    const { formatMessage } = useSafeIntl();
    const dataSets = getDataSetChips(item);
    return (
        <Box sx={styles.item}>
            <LabeledValue
                label={formatMessage(MESSAGES.dataElement)}
                value={nameOrId(item) ?? emptyValue(emptyLabel)}
                dhis2Id={(item.displayName ?? item.name) ? item.id : undefined}
                reserveIdLine
                large
            />
            <Box sx={styles.fields}>
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

// EVENT_TRACKER mapping item: { dataElement | trackedEntityAttribute, ... }
const TrackerItemSummary: FunctionComponent<ItemProps> = ({
    item,
    emptyLabel,
}) => {
    const { formatMessage } = useSafeIntl();
    const target = item.dataElement ?? item.trackedEntityAttribute ?? {};
    return (
        <Box sx={styles.item}>
            <LabeledValue
                label={formatMessage(
                    item.trackedEntityAttribute
                        ? MESSAGES.trackedEntityAttribute
                        : MESSAGES.programDataElement,
                )}
                value={nameOrId(target) ?? emptyValue(emptyLabel)}
                dhis2Id={
                    (target.displayName ?? target.name) ? target.id : undefined
                }
                reserveIdLine
                large
            />
            <Box sx={styles.fields}>
                <LabeledValue
                    label={formatMessage(MESSAGES.valueType)}
                    value={target.valueType ?? item.valueType}
                />
                <LabeledValue
                    label={formatMessage(MESSAGES.useInstanceProperty)}
                    value={item.iaso_field}
                />
            </Box>
        </Box>
    );
};

type Props = {
    mapping?: QuestionMapping;
    mappingType: string;
    // shown in place of the target when there is no mapping
    emptyLabel?: string;
};

/**
 * Readable view of a question mapping, with the same layout when the question
 * is not mapped. Falls back to a raw dump for the shapes it doesn't know.
 */
export const MappingSummary: FunctionComponent<Props> = ({
    mapping,
    mappingType,
    emptyLabel,
}) => {
    const items = (Array.isArray(mapping) ? mapping : [mapping]).filter(
        item => item && Object.keys(item).length > 0,
    ) as Record<string, any>[];
    if (items.length === 0) {
        return mappingType === 'EVENT_TRACKER' ? (
            <TrackerItemSummary item={{}} emptyLabel={emptyLabel} />
        ) : (
            <DataElementSummary item={{}} emptyLabel={emptyLabel} />
        );
    }
    return (
        <>
            {items.map((item, index) => (
                // a mapping item has no id of its own
                // eslint-disable-next-line react/no-array-index-key
                <React.Fragment key={index}>
                    {index > 0 && <Divider sx={styles.separator} />}
                    {item.id && <DataElementSummary item={item} />}
                    {!item.id &&
                        (item.dataElement || item.trackedEntityAttribute) && (
                            <TrackerItemSummary item={item} />
                        )}
                    {!item.id &&
                        !item.dataElement &&
                        !item.trackedEntityAttribute && (
                            <ObjectDumper object={item} />
                        )}
                </React.Fragment>
            ))}
        </>
    );
};
