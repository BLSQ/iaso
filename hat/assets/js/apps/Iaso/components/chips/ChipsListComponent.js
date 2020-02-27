import React, { Component } from 'react';

import {
    Chip, withStyles,
} from '@material-ui/core';
import PropTypes from 'prop-types';
import Add from '@material-ui/icons/Add';
import Cancel from '@material-ui/icons/Cancel';

import commonStyles from '../../styles/common';

const styles = theme => ({
    ...commonStyles(theme),
    marginLeft: {
        marginLeft: theme.spacing(1),
    },
});

class ChipsListComponent extends Component {
    handleClick(chipIndex, chipIsVisible) {
        const {
            chipsList,
            handleListChange,
        } = this.props;
        const newChipsList = [...chipsList];
        newChipsList[chipIndex].isVisible = chipIsVisible;
        handleListChange(newChipsList);
    }

    render() {
        const {
            chipsList,
            classes,
        } = this.props;
        const visibleChips = chipsList.filter(c => c.isVisible);
        return (
            <div>
                {
                    chipsList.map((chip, chipIndex) => (
                        <Chip
                            disabled={visibleChips.length === 1 && chip.isVisible}
                            clickable={false}
                            key={chip.key}
                            label={chip.label}
                            className={classes.marginLeft}
                            color={chip.isVisible ? 'primary' : 'default'}
                            onDelete={() => this.handleClick(chipIndex, !chip.isVisible)}
                            deleteIcon={(
                                chip.isVisible ? <Cancel /> : <Add />
                            )}
                        />
                    ))
                }
            </div>
        );
    }
}


ChipsListComponent.propTypes = {
    chipsList: PropTypes.array.isRequired,
    handleListChange: PropTypes.func.isRequired,
    classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(ChipsListComponent);

