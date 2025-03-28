import React, { FunctionComponent } from 'react';
import ReportIcon from '@mui/icons-material/Report';
import { Box } from '@mui/material';

type Props = {
    title: string;
};

export const ConfirmDialogWarningTitle: FunctionComponent<Props> = ({
    title,
}) => {
    return (
        <Box
            sx={{
                display: 'flex',
                alignItems: 'center',
                width: '100%',
                justifyContent: 'center',
            }}
        >
            <ReportIcon
                sx={{
                    display: 'inline-block',
                    marginLeft: theme => theme.spacing(1),
                    marginRight: theme => theme.spacing(1),
                }}
                color="error"
                fontSize="large"
            />
            {title}
            <ReportIcon
                sx={{
                    display: 'inline-block',
                    marginLeft: theme => theme.spacing(1),
                    marginRight: theme => theme.spacing(1),
                }}
                color="error"
                fontSize="large"
            />
        </Box>
    );
};
