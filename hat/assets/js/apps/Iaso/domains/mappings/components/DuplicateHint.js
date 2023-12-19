import React from 'react';
import PropTypes from 'prop-types';
import Alert from '@mui/lab/Alert';
import { useSafeIntl } from 'bluesquare-components';
import { isNeverMapped } from '../question_mappings';
import MESSAGES from '../messages';

export const DuplicateHint = ({ mapping, mappingVersion }) => {
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
DuplicateHint.defaultProps = {
    mapping: {},
};
DuplicateHint.propTypes = {
    mapping: PropTypes.object,
    mappingVersion: PropTypes.object.isRequired,
};
