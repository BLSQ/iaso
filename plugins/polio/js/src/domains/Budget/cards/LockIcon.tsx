/* eslint-disable react/require-default-props */
import React, { FunctionComponent } from 'react';
import Lock from '@mui/icons-material/Lock';

type Props = {
    internal?: boolean;
};

export const LockIcon: FunctionComponent<Props> = ({ internal = false }) => {
    return internal ? (
        <div
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                verticalAlign: 'middle',
            }}
        >
            <Lock
                style={{
                    fontSize: '16px',
                    marginLeft: '10px',
                    marginBottom: '2px',
                }}
                color="action"
            />
        </div>
    ) : null;
};
