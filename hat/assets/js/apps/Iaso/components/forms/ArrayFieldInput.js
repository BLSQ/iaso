import React, { Component } from 'react';
import PropTypes from 'prop-types';

import List from '@material-ui/core/List';
import Grid from '@material-ui/core/Grid';
import { IconButton, withStyles } from '@material-ui/core';
import ListItem from '@material-ui/core/ListItem';
import OutlinedInput from '@material-ui/core/OutlinedInput';
import Fab from '@material-ui/core/Fab';

import DeleteIcon from '@material-ui/icons/Delete';
import Add from '@material-ui/icons/Add';

import { commonStyles } from 'bluesquare-components';

import { addPositionIndex, removePositionIndex } from '../../utils';

const styles = theme => ({
    ...commonStyles(theme),
    label: {
        top: theme.spacing(2),
        position: 'relative',
        color: theme.textColor,
        fontSize: 16,
    },
    list: {
        width: '100%',
        padding: '0',
    },
    listItem: {
        height: 55,
        width: '100%',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        padding: '0',
        marginBottom: theme.spacing(1),
    },
    addListItem: {
        height: 55,
        width: '100%',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        padding: '0',
        marginBottom: theme.spacing(2),
    },
    input: {
        width: '95%',
        marginLeft: '5%',
    },
    deleteIcon: {
        position: 'absolute',
        right: theme.spacing(1),
    },
});

class ArrayFieldInput extends Component {
    constructor(props) {
        super(props);
        this.state = {
            fieldList: addPositionIndex(props.fieldList),
        };
    }

    // eslint-disable-next-line camelcase
    UNSAFE_componentWillReceiveProps(newProps) {
        this.setState({
            fieldList: addPositionIndex(newProps.fieldList),
        });
    }

    updateField(value, fieldIndex) {
        const newFieldList = this.state.fieldList.slice();
        newFieldList[fieldIndex].value = value;
        this.props.updateList(removePositionIndex(newFieldList));
    }

    addField() {
        const newFieldList = this.state.fieldList.slice();
        newFieldList.push({
            value: '',
            position: this.state.fieldList.length,
        });
        this.props.updateList(removePositionIndex(newFieldList));
    }

    removeField(fieldIndex) {
        const newFieldList = this.state.fieldList.slice();
        newFieldList.splice(fieldIndex, 1);
        this.props.updateList(removePositionIndex(newFieldList));
    }

    render() {
        const { baseId, label, classes } = this.props;
        const { fieldList } = this.state;
        const addFieldButtonDisabled =
            fieldList.length > 0 &&
            fieldList[fieldList.length - 1].value === '';
        return (
            <Grid container spacing={0} className={classes.marginTop}>
                <Grid item xs={1}>
                    <span className={classes.label}>{label}:</span>
                </Grid>
                <Grid item xs={11}>
                    <List className={classes.list}>
                        {fieldList.map((a, fieldIndex) => (
                            <ListItem
                                key={a.position}
                                className={classes.listItem}
                            >
                                <OutlinedInput
                                    className={classes.input}
                                    id={`${baseId}-${a.position}`}
                                    value={a.value || undefined}
                                    onChange={event =>
                                        this.updateField(
                                            event.currentTarget.value,
                                            fieldIndex,
                                        )
                                    }
                                />
                                <IconButton
                                    className={classes.deleteIcon}
                                    color="inherit"
                                    onClick={() => this.removeField(fieldIndex)}
                                >
                                    <DeleteIcon />
                                </IconButton>
                            </ListItem>
                        ))}
                        <ListItem className={classes.addListItem}>
                            <Fab
                                disabled={addFieldButtonDisabled}
                                className={classes.Fab}
                                size="small"
                                color="primary"
                                aria-label="add"
                                onClick={() => this.addField()}
                            >
                                <Add />
                            </Fab>
                        </ListItem>
                    </List>
                </Grid>
            </Grid>
        );
    }
}
ArrayFieldInput.defaultProps = {
    fieldList: [],
};

ArrayFieldInput.propTypes = {
    fieldList: PropTypes.array,
    baseId: PropTypes.string.isRequired,
    updateList: PropTypes.func.isRequired,
    classes: PropTypes.object.isRequired,
    label: PropTypes.string.isRequired,
};

export default withStyles(styles)(ArrayFieldInput);
