import React, { FunctionComponent } from 'react';
import classNames from 'classnames';
import { Box } from '@mui/material';
import { useStyles } from './Welcome';

export const Home: FunctionComponent = () => {
    const classes = useStyles();
    return (
        <Box className={classNames(classes.border, classes.innerBody)}>
            <Box
                style={{
                    display: 'grid',
                    justifyContent: 'center',
                    marginTop: 'calc(25vh - 25px)',
                }}
            >
                <Box className={classNames(classes.title, classes.titleText)}>
                    <span
                        style={{
                            textAlign: 'center',
                            flex: '1',
                        }}
                    >
                        Welcome to the Warp Zone
                    </span>
                </Box>
            </Box>
            <Box className={classes.startText}>Press any key to start</Box>
        </Box>
    );
};
