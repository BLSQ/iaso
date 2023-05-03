import React, {
    FunctionComponent,
    Dispatch,
    SetStateAction,
    useCallback,
} from 'react';
import { Paper, makeStyles, Box } from '@material-ui/core';
import CheckIcon from '@material-ui/icons/Check';

import { Legend } from '../hooks/useGetLegendOptions';

const useStyles = makeStyles(theme => ({
    root: {
        position: 'absolute', // assuming you have a parent relative
        zIndex: 500,
        top: 'auto',
        left: 'auto',
        right: theme.spacing(1),
        bottom: theme.spacing(3),
        width: 'auto',
    },
    option: {
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
    },
    roundColor: {
        borderRadius: 20,
        height: 20,
        width: 20,
        display: 'inline-block',
        marginRight: theme.spacing(1),
    },
    mapLegendLabel: {
        textAlign: 'right',
        display: 'inline-block',
        verticalAlign: 'top',
    },
    checkIcon: {
        color: 'white',
    },
}));

type Props = {
    options: Array<Legend> | undefined;
    setOptions: Dispatch<SetStateAction<Legend[]>>;
};

export const MapLegend: FunctionComponent<Props> = ({
    options,
    setOptions,
}) => {
    const classes = useStyles();
    const handleClick = useCallback(
        (optionIndex: number): void => {
            const newOptions = [...(options || [])];
            if (newOptions?.[optionIndex]) {
                newOptions[optionIndex].active =
                    !newOptions[optionIndex].active;
                setOptions(newOptions);
            }
        },
        [options, setOptions],
    );

    return (
        <Paper elevation={1} className={classes.root}>
            <Box p={2}>
                {options &&
                    options.map((option, i) => (
                        <Box
                            key={option.value}
                            mb={i + 1 === options.length ? 0 : 1}
                            onClick={() => handleClick(i)}
                            role="button"
                            tabIndex={0}
                            className={classes.option}
                        >
                            <span
                                className={classes.roundColor}
                                style={{ backgroundColor: option.color }}
                            >
                                {option.active && (
                                    <CheckIcon
                                        fontSize="small"
                                        className={classes.checkIcon}
                                    />
                                )}
                            </span>

                            <span className={classes.mapLegendLabel}>
                                {option.label}
                            </span>
                        </Box>
                    ))}
            </Box>
        </Paper>
    );
};
