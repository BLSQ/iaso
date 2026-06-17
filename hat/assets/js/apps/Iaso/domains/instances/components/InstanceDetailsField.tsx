import React, { FunctionComponent } from 'react';
import { Grid, Typography } from '@mui/material';
import { makeStyles } from '@mui/styles';
import { textPlaceholder, commonStyles } from 'bluesquare-components';

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
    paper: {
        padding: theme.spacing(2),
    },
    labelContainer: {
        display: 'flex',
        width: '100%',
        justifyContent: 'flex-end',
        alignItems: 'center',
        position: 'relative',
        top: 2,
    },
    value: {
        wordBreak: 'break-all',
    },
}));

type Props = {
    renderValue?: any;
    label: string;
    value?: any;
    Icon?: any;
    valueTitle: any;
};

const InstanceDetailsField: FunctionComponent<Props> = ({
    label,
    value,
    Icon,
    valueTitle = '',
    renderValue,
}) => {
    const classes: Record<string, string> = useStyles();
    return (
        <Grid container spacing={1}>
            <Grid size={5}>
                <div className={classes.labelContainer}>
                    {Icon && <Icon />}
                    <Typography
                        variant="body2"
                        noWrap
                        title={label}
                        sx={{
                            color: "inherit"
                        }}
                    >
                        {label}
                    </Typography>
                    :
                </div>
            </Grid>
            <Grid
                container
                size={7}
                sx={{
                    justifyContent: "flex-start",
                    alignItems: "center"
                }}>
                <Typography
                    variant="body1"
                    title={valueTitle !== '' ? valueTitle : value}
                    className={classes.value}
                    sx={{
                        color: "inherit"
                    }}
                >
                    {renderValue && renderValue(value)}
                    {!renderValue && (value || textPlaceholder)}
                </Typography>
            </Grid>
        </Grid>
    );
};

export default InstanceDetailsField;
