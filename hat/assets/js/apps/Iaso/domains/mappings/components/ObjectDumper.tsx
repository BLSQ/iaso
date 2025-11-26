import React, { FunctionComponent } from 'react';
import Typography from '@mui/material/Typography';

type Props = {
    object?: Record<string, any> | null;
};
const ObjectDumper: FunctionComponent<Props> = ({ object = null }) => {
    if (object === undefined || object === null) {
        return <div />;
    }
    return (
        <div style={{ paddingLeft: '20px' }}>
            {Object.keys(object)
                .filter(field => field !== 'children')
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

export default ObjectDumper;
