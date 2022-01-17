import React, { FunctionComponent } from 'react';
import { makeStyles, Typography } from '@material-ui/core';

type Props = {
    text: string;
    displayTrigger: unknown;
};
const useStyles = makeStyles({ graphTitle: { fontWeight: 'bold' } });
export const GraphTitle: FunctionComponent<Props> = ({
    text,
    displayTrigger,
}) => {
    const classes = useStyles();
    return (
        <>
            {displayTrigger && (
                <Typography variant="h6" className={classes.graphTitle}>
                    {text}
                </Typography>
            )}
        </>
    );
};
