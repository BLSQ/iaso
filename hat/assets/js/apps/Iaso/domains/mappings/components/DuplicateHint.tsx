import React, { FunctionComponent } from 'react';
import Alert from '@mui/material/Alert';
import { useSafeIntl } from 'bluesquare-components';
import MESSAGES from '../messages';
import { isNeverMapped } from '../question_mappings';

type Props = {
    mapping?: Record<string, any>;
    mappingVersion: Record<string, any>;
};

export const DuplicateHint: FunctionComponent<Props> = ({
    mapping = {} as Record<string, any>,
    mappingVersion,
}) => {
    const { formatMessage } = useSafeIntl();
    if (isNeverMapped(mapping) || Object.keys(mapping).length === 0) {
        return null;
    }
    const duplicates = [];
    Object.keys(mappingVersion.question_mappings).forEach(questionName => {
        const qmap = mappingVersion.question_mappings[questionName];
        if (!Array.isArray(qmap)) {
            if (
                mapping.id === qmap.id &&
                mapping.categoryOptionCombo === qmap.categoryOptionCombo
            ) {
                duplicates.push(questionName);
            }
        }
    });
    if (duplicates.length <= 1) {
        return <></>;
    }
    return (
        <Alert severity="error">
            {formatMessage(MESSAGES.duplicateMappingAlert, {
                duplicates: duplicates.join(' , '),
            })}
        </Alert>
    );
};
