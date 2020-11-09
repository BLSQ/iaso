import React from 'react';
import PropTypes from 'prop-types';
import { Typography } from '@material-ui/core';

export default function ColumnTextComponent({ text, title }) {
    return (
        <Typography variant="body2" noWrap title={title !== '' ? title : text}>
            {text}
        </Typography>
    );
}

ColumnTextComponent.defaultProps = {
    title: '',
};

ColumnTextComponent.propTypes = {
    text: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.number,
        PropTypes.node,
    ]).isRequired,
    title: PropTypes.string,
};
