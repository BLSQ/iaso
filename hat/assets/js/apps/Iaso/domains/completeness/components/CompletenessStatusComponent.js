import React from 'react';
import PropTypes from 'prop-types';
import { Tooltip } from '@material-ui/core';
import HourglassEmpty from '@material-ui/icons/HourglassEmpty';
import ErrorOutline from '@material-ui/icons/ErrorOutline';
import CheckCircleOutline from '@material-ui/icons/CheckCircleOutline';

const STATUS_COLUMN_ICONS = {
    ready: HourglassEmpty,
    error: ErrorOutline,
    exported: CheckCircleOutline,
};

export default function StatusIcon({ status, title }) {
    const IconComponent = STATUS_COLUMN_ICONS[status];

    return (
        <Tooltip title={title}>
            <IconComponent />
        </Tooltip>
    );
}
StatusIcon.propTypes = {
    status: PropTypes.oneOf(Object.keys(STATUS_COLUMN_ICONS)).isRequired,
    title: PropTypes.string.isRequired,
};
