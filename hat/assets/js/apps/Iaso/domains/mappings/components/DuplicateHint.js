import React from 'react';
import PropTypes from 'prop-types';
import Alert from '@material-ui/lab/Alert';
import { isNeverMapped } from '../question_mappings';

export const DuplicateHint = ({ mapping, mappingVersion }) => {
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
            Duplicate mapping ! will be used in both {duplicates.join(' , ')}
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
