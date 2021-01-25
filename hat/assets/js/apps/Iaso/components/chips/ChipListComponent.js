import React, { useCallback } from 'react';
import PropTypes from 'prop-types';
import { Chip, withStyles } from '@material-ui/core';
import Add from '@material-ui/icons/Add';
import Cancel from '@material-ui/icons/Cancel';

import { translateOptions } from '../../utils/intlUtil';
import commonStyles from '../../styles/common';
import injectIntl from '../../libs/intl/injectIntl';

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
    intl: { formatMessage },
}) {
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
}
ChipListComponent.propTypes = {
    classes: PropTypes.object.isRequired,
    options: PropTypes.array.isRequired,
    value: PropTypes.arrayOf(
        PropTypes.oneOfType([
            PropTypes.string,
            PropTypes.bool,
            PropTypes.number,
        ]),
    ).isRequired,
    onChange: PropTypes.func.isRequired,
    intl: PropTypes.object.isRequired,
};
export default injectIntl(withStyles(styles)(ChipListComponent));
