import React from 'react';
import PropTypes from 'prop-types';
import { Typography } from '@material-ui/core';

export default function ColumnTextComponent({ text }) {
    return (
        <Typography variant="body2" noWrap title={text}>
            {text}
        </Typography>
    );
}
ColumnTextComponent.propTypes = {
    text: PropTypes.string.isRequired,
};
