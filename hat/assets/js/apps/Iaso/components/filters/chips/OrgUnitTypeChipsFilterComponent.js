import React, { Component } from 'react';
import { connect } from 'react-redux';
import { FormattedMessage } from 'react-intl';
import {
    withStyles,
    Box,
    Chip,
    Typography,
} from '@material-ui/core';

import PropTypes from 'prop-types';

import orgUnitIconUrl from '../../../../../../../dashboard/static/images/white-pentagon.svg';

import commonStyles from '../../../styles/common';

import { setCurrentSubOrgUnitTypesSelected, setFetching } from '../../../redux/orgUnitsReducer';

import { fetchSubOrgUnitsByType } from '../../../utils/requests';

import InputComponent from '../../forms/InputComponent';

import chipColors from '../../../constants/chipColors';

const styles = theme => ({
    ...commonStyles(theme),
    chip: {
        marginRight: theme.spacing(1),
        marginBottom: theme.spacing(1),
    },
});


const getSubOrgunits = (orgUnit, orgUnitTypes, orgUnitTypesList, orgUnitTypesSelected) => {
    let newOrgUnitTypesList = [...orgUnitTypesList];
    if (orgUnit.sub_unit_types.length > 0) {
        orgUnit.sub_unit_types.forEach((subOrgUnit) => {
            const fullSubOrgUnit = orgUnitTypes.find(o => o.id === subOrgUnit.id);
            if (!newOrgUnitTypesList.find(o => o.id === subOrgUnit.id)
                && !orgUnitTypesSelected.find(os => os.id === subOrgUnit.id)) {
                newOrgUnitTypesList.push(fullSubOrgUnit);
            }
            if (fullSubOrgUnit.sub_unit_types && fullSubOrgUnit.id !== orgUnit.id) {
                newOrgUnitTypesList = getSubOrgunits(fullSubOrgUnit, orgUnitTypes, newOrgUnitTypesList, orgUnitTypesSelected);
            }
        });
    }
    return newOrgUnitTypesList;
};


class OrgUnitTypeChipsFilterComponent extends Component {
    constructor(props) {
        super(props);
        const coloredOrgUnitTypes = [];
        props.orgUnitTypes.forEach((o, i) => {
            coloredOrgUnitTypes.push({
                ...o,
                color: chipColors[i],
            });
        });
        this.state = {
            orgUnitTypesList: [],
            orgUnitTypes: coloredOrgUnitTypes,
        };
    }

    componentDidMount() {
        const {
            currentOrgUnit,
        } = this.props;
        const {
            orgUnitTypes,
        } = this.state;

        const orgUnitTypesSelected = [];
        let orgUnitTypesList = [];
        orgUnitTypes.forEach((ot) => {
            if (currentOrgUnit.org_unit_type.sub_unit_types.find(o => o.id === ot.id)) {
                orgUnitTypesSelected.push(ot);
            }
        });
        orgUnitTypesSelected.forEach((ot) => {
            orgUnitTypesList = getSubOrgunits(ot, orgUnitTypes, orgUnitTypesList, orgUnitTypesSelected);
        });
        this.updateOrgUnitTypesSelected(orgUnitTypesSelected);
        this.setState({
            orgUnitTypesList,
        });
    }

    componentWillUnmount() {
        this.props.setCurrentSubOrgUnitTypesSelected([]);
    }

    onOrgUnitSelect(orgUnitId) {
        const {
            orgUnitTypes,
            orgUnitTypesList,
        } = this.state;
        const {
            orgUnitTypesSelected,
        } = this.props;
        const newOrgUnitTypesSelected = [...orgUnitTypesSelected];
        const newOrgUnitTypesList = [];
        orgUnitTypesList.forEach((o) => {
            if (o.id !== orgUnitId) {
                newOrgUnitTypesList.push(o);
            }
        });
        const newOrgUnit = orgUnitTypes.find(o => o.id === orgUnitId);
        newOrgUnitTypesSelected.push(newOrgUnit);
        this.updateOrgUnitTypesSelected(newOrgUnitTypesSelected);
        this.setState({
            orgUnitTypesList: newOrgUnitTypesList,
        });
    }

    onDeleteOrgUnit(orgUnitId) {
        const {
            orgUnitTypes,
            orgUnitTypesList,
        } = this.state;
        const {
            orgUnitTypesSelected,
        } = this.props;
        const newOrgUnitTypesSelected = [];
        const newOrgUnitTypesList = [...orgUnitTypesList];
        orgUnitTypesSelected.forEach((o) => {
            if (o.id !== orgUnitId) {
                newOrgUnitTypesSelected.push(o);
            }
        });
        const deletedOrgUnit = orgUnitTypes.find(o => o.id === orgUnitId);
        newOrgUnitTypesList.push(deletedOrgUnit);
        this.updateOrgUnitTypesSelected(newOrgUnitTypesSelected);
        this.setState({
            orgUnitTypesList: newOrgUnitTypesList,
        });
    }

    updateOrgUnitTypesSelected(orgUnitTypesSelected) {
        const {
            dispatch,
            currentOrgUnit,
        } = this.props;
        const promisesArray = [];
        const oldOrgUnitsTypes = [];
        orgUnitTypesSelected.forEach((ot) => {
            if (!ot.orgUnits) {
                promisesArray.push(
                    fetchSubOrgUnitsByType(
                        dispatch,
                        `&orgUnitParentId=${currentOrgUnit.id}&orgUnitTypeId=${ot.id}&withShapes=true`,
                        ot,
                    ),
                );
            } else {
                oldOrgUnitsTypes.push(ot);
            }
        });
        this.props.setFetching(true);
        Promise.all(promisesArray).then((orgUnits) => {
            const orgUnitsTypesWithData = oldOrgUnitsTypes.concat(orgUnits);
            this.props.setCurrentSubOrgUnitTypesSelected(orgUnitsTypesWithData);
            this.props.setFetching(false);
        });
    }

    render() {
        const {
            classes,
            orgUnitTypesSelected,
        } = this.props;
        const {
            orgUnitTypesList,
        } = this.state;
        return (
            <Box
                px={4}
                py={2}
                component="div"
            >
                {
                    orgUnitTypesSelected.length > 0 && (
                        orgUnitTypesSelected.map(o => (
                            <Chip
                                key={o.id}
                                icon={<img src={orgUnitIconUrl} className={classes.svgChipIcon} alt="org unit" />}
                                label={o.short_name}
                                clickable
                                className={classes.chip}
                                onDelete={() => this.onDeleteOrgUnit(o.id)}
                                style={{
                                    backgroundColor: o.color,
                                    color: 'white',
                                }}
                            />
                        ))
                    )
                }
                {
                    orgUnitTypesList.length > 0 && (
                        <InputComponent
                            withMarginTop={false}
                            keyValue="org_unit_type_id"
                            onChange={(key, orgUnitTypeId) => this.onOrgUnitSelect(orgUnitTypeId)}
                            value={null}
                            type="select"
                            options={
                                orgUnitTypesList.map(t => ({
                                    label: t.name,
                                    value: t.id,
                                }))
                            }
                            label={{
                                id: 'iaso.orgUnits.addOrgUnitType',
                                defaultMessage: 'Add org unit type',
                            }}
                        />
                    )
                }
            </Box>
        );
    }
}

OrgUnitTypeChipsFilterComponent.propTypes = {
    classes: PropTypes.object.isRequired,
    orgUnitTypes: PropTypes.array.isRequired,
    currentOrgUnit: PropTypes.object.isRequired,
    orgUnitTypesSelected: PropTypes.array.isRequired,
    setCurrentSubOrgUnitTypesSelected: PropTypes.func.isRequired,
    setFetching: PropTypes.func.isRequired,
    dispatch: PropTypes.func.isRequired,
};

const MapStateToProps = state => ({
    orgUnitTypesSelected: state.orgUnits.currentSubOrgUnitsTypesSelected,
    currentOrgUnit: state.orgUnits.current,
    orgUnitTypes: state.orgUnits.orgUnitTypes,
});

const MapDispatchToProps = dispatch => ({
    dispatch,
    setCurrentSubOrgUnitTypesSelected: orgUnitTypesSelected => dispatch(setCurrentSubOrgUnitTypesSelected(orgUnitTypesSelected)),
    setFetching: fetching => dispatch(setFetching(fetching)),
});

export default connect(MapStateToProps, MapDispatchToProps)(withStyles(styles)(OrgUnitTypeChipsFilterComponent));
