import React, { FunctionComponent } from 'react';
import { Alert } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import MESSAGES from '../messages';

type Props = {
    mapping?: Record<string, any>;
    mappingVersion: Record<string, any>;
};

export const DuplicateHint: FunctionComponent<Props> = ({
    mapping = {} as Record<string, any>,
    mappingVersion,
}) => {
    const { formatMessage } = useSafeIntl();
    // tracker mappings (lists) and never mapped markers have no id to compare
    if (!mapping.id) {
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
