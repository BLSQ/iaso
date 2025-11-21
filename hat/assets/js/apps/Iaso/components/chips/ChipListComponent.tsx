import React, { FunctionComponent, useCallback } from 'react';
import Add from '@mui/icons-material/Add';
import Cancel from '@mui/icons-material/Cancel';
import { Chip } from '@mui/material';
import { makeStyles, withStyles } from '@mui/styles';

import {
    translateOptions,
    useSafeIntl,
    commonStyles,
    DropdownOptions,
} from 'bluesquare-components';

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
    marginLeft: {
        marginLeft: theme.spacing(1),
    },
}));

type Props<T extends string | boolean | number> = {
    options: DropdownOptions<T>[];
    value: T[];
    onChange: (value: T[]) => void;
};

export const ChipListComponent = <T extends string | boolean | number>({
    options,
    value,
    onChange,
}: Props<T>) => {
    const classes = useStyles();
    const { formatMessage } = useSafeIntl();
    const toggleChip = useCallback(
        chipValue => {
            const newValue = value.includes(chipValue)
                ? value.filter(singleValue => singleValue !== chipValue)
                : [...value, chipValue];
            onChange(newValue);
        },
        [value, onChange],
    );

    return (
        <div>
            {translateOptions(options, formatMessage).map(option => {
                const isActive = value.includes(option.value);
                return (
                    <Chip
                        disabled={value.length === 1 && isActive}
                        key={option.value}
                        label={option.label}
                        className={classes.marginLeft}
                        color={isActive ? 'primary' : 'default'}
                        onClick={() => toggleChip(option.value)}
                        icon={isActive ? <Cancel /> : <Add />}
                    />
                );
            })}
        </div>
    );
};
