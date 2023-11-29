import React, { FunctionComponent, Dispatch, SetStateAction } from 'react';
import { Paper, makeStyles, Box } from '@material-ui/core';

import InputComponent from '../../../components/forms/InputComponent';
import MESSAGES from '../messages';
import { DisplayedLocation } from '../types/locations';

const useStyles = makeStyles(theme => ({
    root: {
        position: 'absolute', // assuming you have a parent relative
        zIndex: 500,
        bottom: theme.spacing(3),
        right: theme.spacing(2),
        left: 'auto',
        top: 'auto',
        width: 180,
    },
}));

export type Legend = {
    value: string;
    label: string;
    color: string; // has to be an hexa color
};

type Props = {
    displayedLocation: DisplayedLocation;
    setDisplayedLocation: Dispatch<SetStateAction<DisplayedLocation>>;
};

export const LocationSwitch: FunctionComponent<Props> = ({
    displayedLocation,
    setDisplayedLocation,
}) => {
    const classes = useStyles();
    return (
        <Paper elevation={1} className={classes.root}>
            <Box p={2}>
                <InputComponent
                    withMarginTop={false}
                    type="checkbox"
                    value={displayedLocation === 'orgUnits'}
                    keyValue="orgUnits"
                    onChange={() => {
                        setDisplayedLocation('orgUnits');
                    }}
                    label={MESSAGES.orgUnits}
                />
                <InputComponent
                    withMarginTop={false}
                    type="checkbox"
                    value={displayedLocation === 'submissions'}
                    keyValue="submissions"
                    onChange={() => {
                        setDisplayedLocation('submissions');
                    }}
                    label={MESSAGES.submissions}
                />
            </Box>
        </Paper>
    );
};
