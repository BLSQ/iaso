import React, { Component } from 'react';
import { connect } from 'react-redux';

import {
    withStyles,
    Box,
    Chip,
} from '@material-ui/core';

import PropTypes from 'prop-types';

import commonStyles from '../../../styles/common';

import { setFetching } from '../../../redux/orgUnitsReducer';

import InputComponent from '../../forms/InputComponent';

const styles = theme => ({
    ...commonStyles(theme),
    chip: {
        marginRight: theme.spacing(1),
        marginBottom: theme.spacing(1),
    },
});


class ChipsFilterComponent extends Component {
    componentWillUnmount() {
        this.props.setSelectedItems([]);
    }

    onAdd(itemId) {
        const {
            selectedItems,
            currentItems,
        } = this.props;
        const newSelectedItems = [...selectedItems];
        const item = currentItems.find(i => i.id === itemId);
        if (!newSelectedItems.includes(item)) {
            newSelectedItems.push(item);
            this.updateItems(newSelectedItems);
        }
    }

    onDelete(item) {
        const {
            selectedItems,
        } = this.props;
        const newSelectedItems = [...selectedItems];
        if (newSelectedItems.includes(item)) {
            newSelectedItems.splice(newSelectedItems.indexOf(item), 1);
        }
        this.props.setSelectedItems(newSelectedItems);
    }

    updateItems(selectedItems) {
        const {
            fetchDetails,
            locationsKey,
        } = this.props;
        const promisesArray = [];
        const oldItems = [];
        selectedItems.forEach((i) => {
            if (!i[locationsKey]) {
                promisesArray.push(
                    fetchDetails(i),
                );
            } else {
                oldItems.push(i);
            }
        });
        this.props.setFetching(true);
        Promise.all(promisesArray).then((items) => {
            const itemsWithData = oldItems.concat(items);
            this.props.setSelectedItems(itemsWithData);
            this.props.setFetching(false);
        });
    }

    render() {
        const {
            classes,
            selectedItems,
            currentItems,
            chipIconUrl,
            selectLabelMessage,
        } = this.props;
        let notSelectedItems = [];
        if (currentItems) {
            notSelectedItems = currentItems.filter(f => !selectedItems.find(fo => fo.id === f.id));
        }
        return (
            <Box
                px={4}
                py={2}
                component="div"
            >
                {
                    selectedItems.length > 0 && (
                        selectedItems.map(f => (
                            <Chip
                                key={f.id}
                                icon={<img src={chipIconUrl} className={classes.svgChipIcon} alt="item" />}
                                label={`${f.name} - ${f.instances.length}`}
                                clickable
                                className={classes.chip}
                                onDelete={() => this.onDelete(f)}
                                style={{
                                    backgroundColor: f.color,
                                    color: 'white',
                                }}
                            />
                        ))
                    )
                }
                {
                    notSelectedItems.length > 0 && (
                        <InputComponent
                            withMarginTop={false}
                            keyValue="form_id"
                            onChange={(key, formId) => this.onAdd(formId)}
                            value={null}
                            type="select"
                            options={
                                notSelectedItems.map(t => ({
                                    label: t.name,
                                    value: t.id,
                                }))
                            }
                            label={selectLabelMessage}
                        />
                    )
                }
            </Box>
        );
    }
}

ChipsFilterComponent.defaultProps = {
    currentItems: null,
};

ChipsFilterComponent.propTypes = {
    classes: PropTypes.object.isRequired,
    currentItems: PropTypes.any,
    selectedItems: PropTypes.array.isRequired,
    setSelectedItems: PropTypes.func.isRequired,
    setFetching: PropTypes.func.isRequired,
    fetchDetails: PropTypes.func.isRequired,
    locationsKey: PropTypes.string.isRequired,
    chipIconUrl: PropTypes.string.isRequired,
    selectLabelMessage: PropTypes.string.isRequired,
};

const MapStateToProps = () => ({
});

const MapDispatchToProps = dispatch => ({
    setFetching: fetching => dispatch(setFetching(fetching)),
});

export default connect(MapStateToProps, MapDispatchToProps)(withStyles(styles)(ChipsFilterComponent));
