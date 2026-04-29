import React from 'react';
import { Box } from '@mui/material';
import { BoxProps } from '@mui/material/Box/Box';
import { SxStyles } from 'Iaso/types/general';

const styles: SxStyles = {
    badge: {
        border: theme => `3px solid ${theme.palette.lightGray.border}`,
        borderRadius: theme => theme.spacing(3),
        width: theme => theme.spacing(3),
        height: theme => theme.spacing(3),
        display: 'inline-block',
        outline: 'none !important',
    },
};

type Props = Omit<BoxProps<'span'>, 'children' | 'component'> & {
    backgroundColor?: string;
};

export const ColorBadge = ({ backgroundColor, sx, ...props }: Props) => {
    if (!backgroundColor) {
        return null;
    }

    return (
        <Box
            component={'span'}
            sx={[
                styles.badge,
                { backgroundColor },
                ...(Array.isArray(sx) ? sx : [sx]),
            ]}
            {...props}
        />
    );
};
