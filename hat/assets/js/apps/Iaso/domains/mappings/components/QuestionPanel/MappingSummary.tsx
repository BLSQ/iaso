import React, { FunctionComponent } from 'react';
import { Divider } from '@mui/material';
import { SxStyles } from '../../../../types/general';
import { QuestionMapping } from '../../types';
import ObjectDumper from '../ObjectDumper';
import { DataElementSummary } from './DataElementSummary';
import { TrackerItemSummary } from './TrackerItemSummary';

const styles: SxStyles = {
    separator: {
        my: 2,
    },
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
    const items = (Array.isArray(mapping) ? mapping : [mapping ?? {}]).filter(
        item => Object.keys(item).length > 0,
    );
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
