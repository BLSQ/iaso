import React, { useCallback } from 'react';
import PropTypes from 'prop-types';
import { Chip, withStyles } from '@material-ui/core';

import commonStyles from '../../styles/common';

const styles = theme => ({
    ...commonStyles(theme),
    marginLeft: {
        marginLeft: theme.spacing(1),
    },
});

function ChipListComponent({
    options,
    value,
    classes,
    onChange,
}) {
    const toggleChip = useCallback((chipValue) => {
        const newValue = value.includes(chipValue)
            ? value.filter(singleValue => singleValue !== chipValue)
            : [...value, chipValue];
        onChange(newValue);
    }, [value, onChange]);

    return (
        <div>
            {
                options.map((option) => {
                    const isActive = value.includes(option.value);
                    return (
                        <Chip
                            disabled={value.length === 1 && isActive}
                            key={option.value}
                            label={option.label}
                            className={classes.marginLeft}
                            color={isActive ? 'primary' : 'default'}
                            onClick={() => toggleChip(option.value)}
                        />
                    );
                })
            }
        </div>
    );
}
ChipListComponent.propTypes = {
    classes: PropTypes.object.isRequired,
    options: PropTypes.array.isRequired,
    value: PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.string, PropTypes.bool, PropTypes.number])).isRequired,
    onChange: PropTypes.func.isRequired,
};
export default withStyles(styles)(ChipListComponent);
