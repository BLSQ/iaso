import React, { FunctionComponent } from 'react';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import Stack from '@mui/material/Stack/Stack';
import Typography from '@mui/material/Typography/Typography';

type Props = {
    message: string;
    paddingLeft?: string | null;
    paddingTop?: string | null;
    marginRight?: string | null;
};
const WarningMessage: FunctionComponent<Props> = ({
    message,
    paddingLeft = null,
    paddingTop = null,
    marginRight = null,
}) => (
    <Stack
        direction="row"
        spacing={1}
        alignItems="center"
        sx={{
            paddingLeft,
            paddingTop,
            marginRight,
            color: theme => theme.palette.warning.main,
        }}
    >
        <WarningAmberIcon />
        <Typography>{message}</Typography>
    </Stack>
);

export default WarningMessage;
