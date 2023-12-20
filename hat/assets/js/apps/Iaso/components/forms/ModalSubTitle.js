import React from 'react';
import { Typography, Grid } from '@mui/material';
import { makeStyles } from '@mui/styles';
import { useSafeIntl } from 'bluesquare-components';
import { oneOfType, string, object, number, bool } from 'prop-types';

const style = theme => ({
    subTitle: {
        color: theme.palette.primary.main,
        fontWeight: 'bold',
    },
});
const useStyles = makeStyles(style);

const makeText = (message, formatMessage) => {
    if (!message) return '';
    if (typeof message === 'string') return message;
    return formatMessage(message);
};

export const ModalSubTitle = ({ message, xs, sm, md, lg, xl, isGrid }) => {
    const classes = useStyles();
    const { formatMessage } = useSafeIntl();
    const text = makeText(message, formatMessage);
    const subTitleComponent = () => (
        <Typography variant="subtitle1" className={classes.subTitle}>
            {text}
        </Typography>
    );
    if (isGrid) {
        return (
            <Grid item xs={xs} sm={sm} md={md} lg={lg} xl={xl}>
                {subTitleComponent()}
            </Grid>
        );
    }
    return subTitleComponent();
};

ModalSubTitle.propTypes = {
    message: oneOfType([string, object]).isRequired,
    xs: number,
    sm: number,
    md: number,
    lg: number,
    xl: number,
    isGrid: bool,
};
ModalSubTitle.defaultProps = {
    xs: 12,
    sm: undefined,
    md: undefined,
    lg: undefined,
    xl: undefined,
    isGrid: true,
};
