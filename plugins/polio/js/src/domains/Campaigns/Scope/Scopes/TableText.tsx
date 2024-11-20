import { Tooltip, Typography } from '@mui/material';
import React, { FunctionComponent } from 'react';

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
