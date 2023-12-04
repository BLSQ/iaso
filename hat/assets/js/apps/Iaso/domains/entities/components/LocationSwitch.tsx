import React, { FunctionComponent, Dispatch, SetStateAction } from 'react';
import { Paper, makeStyles, Box } from '@material-ui/core';

import { IntlMessage } from 'bluesquare-components';
import InputComponent from '../../../components/forms/InputComponent';
import { DisplayedLocation } from '../types/locations';

const useStyles = makeStyles(theme => ({
    root: {
        position: 'absolute', // assuming you have a parent relative
        zIndex: 500,
        bottom: theme.spacing(3),
        right: theme.spacing(2),
        left: 'auto',
        top: 'auto',
        width: 250,
    },
}));

export type Legend = {
    value: string;
    label: string;
    color: string; // has to be an hexa color
};

export type LocationOption = {
    value: DisplayedLocation;
    label: IntlMessage;
};

type Props = {
    displayedLocation: DisplayedLocation;
    setDisplayedLocation: Dispatch<SetStateAction<DisplayedLocation>>;
    locationOptions: LocationOption[];
};

export const LocationSwitch: FunctionComponent<Props> = ({
    displayedLocation,
    setDisplayedLocation,
    locationOptions,
}) => {
    const classes = useStyles();
    return (
        <Paper elevation={1} className={classes.root}>
            <Box p={2}>
                {locationOptions.map(option => (
                    <InputComponent
                        withMarginTop={false}
                        type="checkbox"
                        value={displayedLocation === option.value}
                        key={option.value}
                        keyValue={option.value}
                        onChange={() => {
                            setDisplayedLocation(option.value);
                        }}
                        label={option.label}
                    />
                ))}
            </Box>
        </Paper>
    );
};
