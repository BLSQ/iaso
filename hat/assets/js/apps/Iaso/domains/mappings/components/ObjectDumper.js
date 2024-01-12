import React from 'react';
import PropTypes from 'prop-types';

import Typography from '@mui/material/Typography';

const ObjectDumper = ({ object }) => {
    if (object === undefined || object === null) {
        return <div />;
    }
    return (
        <div style={{ paddingLeft: '20px' }}>
            {Object.keys(object)
                .filter(field =>
                    object && object.type === 'repeat'
                        ? field !== 'children'
                        : true,
                )
                .map(field => (
                    <span key={field}>
                        <Typography variant="body1">
                            <b>{field} :</b>{' '}
                            {typeof object[field] === 'string'
                                ? object[field]
                                : JSON.stringify(object[field])}
                        </Typography>
                    </span>
                ))}
        </div>
    );
};

ObjectDumper.defaultProps = {
    object: null,
};

ObjectDumper.propTypes = {
    object: PropTypes.object,
};

export default ObjectDumper;
