import React, { FunctionComponent } from 'react';
import HomeIcon from '@mui/icons-material/Home';
import { IconButton as MuiIconButton, Tooltip } from '@mui/material';
import { makeStyles } from '@mui/styles';
import { useSafeIntl } from 'bluesquare-components';

import { baseUrls } from '../../constants/urls';
import MESSAGES from './messages';

const useStyles = makeStyles(theme => ({
    homePageButton: {
        padding: theme.spacing(0),
    },
}));

type Props = {
    color?: 'inherit' | 'primary' | 'secondary';
};

export const HomePageButton: FunctionComponent<Props> = ({
    color = 'inherit',
}) => {
    const classes = useStyles();
    const { formatMessage } = useSafeIntl();
    return (
        <Tooltip arrow title={formatMessage(MESSAGES.homePage)}>
            <MuiIconButton
                className={classes.homePageButton}
                color={color}
                href={`/dashboard/${baseUrls.home}`}
                id="top-bar-home-page-button"
            >
                <HomeIcon />
            </MuiIconButton>
        </Tooltip>
    );
};
