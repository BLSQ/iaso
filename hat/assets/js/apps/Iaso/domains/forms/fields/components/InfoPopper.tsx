import React, { FunctionComponent, useState, MouseEvent } from 'react';
import { useSafeIntl } from 'bluesquare-components';
import { Theme } from '@mui/material/styles';
import { makeStyles } from '@mui/styles';
import { Popper, Box, IconButton, Paper, Typography } from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';

import { Link } from 'react-router-dom';
import { iasoFields, xlsQuestionsTypesLink } from '../constants';
import { MESSAGES } from '../messages';

const useStyles = makeStyles((theme: Theme) => ({
    popper: {
        zIndex: 1300,
    },
    closeButton: {
        position: 'absolute',
        right: 0,
        top: 0,
    },
    paper: {
        padding: theme.spacing(1, 2, 2, 2),
        backgroundColor: theme.palette.grey['200'],
    },
    subtitle1: {
        paddingRight: theme.spacing(2),
    },
}));

export const InfoPopper: FunctionComponent = () => {
    const classes = useStyles();
    const { formatMessage } = useSafeIntl();
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const activFields: string = iasoFields
        .filter(iasoField => !iasoField.disabled)
        .map(iasoField => iasoField.type)
        .join(', ');

    const handleClick = (event: MouseEvent<HTMLElement>) => {
        setAnchorEl(anchorEl ? null : event.currentTarget);
    };

    const open = Boolean(anchorEl);
    return (
        <Box>
            <IconButton onClick={handleClick}>
                <InfoOutlinedIcon color="primary" />
            </IconButton>
            <Popper
                popperOptions={{
                    modifiers: {
                        offset: {
                            offset: '0,05',
                        },
                    },
                }}
                className={classes.popper}
                open={open}
                anchorEl={anchorEl}
                placement="right-start"
            >
                <IconButton
                    size="small"
                    onClick={handleClick}
                    className={classes.closeButton}
                >
                    <CancelOutlinedIcon color="primary" fontSize="small" />
                </IconButton>
                <Paper className={classes.paper} elevation={1}>
                    <Typography
                        variant="subtitle1"
                        className={classes.subtitle1}
                    >
                        {formatMessage(MESSAGES.supportedTypeFields)}:
                    </Typography>
                    <Box mb={1}>{activFields}</Box>
                    <Link
                        target="_blank"
                        to={xlsQuestionsTypesLink}
                        reloadDocument
                    >
                        {formatMessage(MESSAGES.xlsQuestionsTypesLink)}
                    </Link>
                </Paper>
            </Popper>
        </Box>
    );
};
