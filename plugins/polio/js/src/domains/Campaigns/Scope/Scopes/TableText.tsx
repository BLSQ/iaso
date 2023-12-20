import React, { FunctionComponent } from 'react';
import { Typography, Tooltip } from '@mui/material';

type Props = {
    text: string;
};
export const TableText: FunctionComponent<Props> = ({ text }) => {
    return (
        <Tooltip placement="bottom" title={text ?? 'no text'}>
            <Typography
                variant="overline"
                style={{
                    maxWidth: '100px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                }}
            >
                {text}
            </Typography>
        </Tooltip>
    );
};
