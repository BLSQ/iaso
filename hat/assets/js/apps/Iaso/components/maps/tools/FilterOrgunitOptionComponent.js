import React, { Component, Fragment } from 'react';
import { FormattedMessage } from 'react-intl';
import {
    withStyles,
    Box,
    Chip,
    Divider,
    Typography,
} from '@material-ui/core';

import PropTypes from 'prop-types';

import orgUnitIconUrl from '../../../images/white-pentagon.svg';

import commonStyles from '../../../styles/common';
import InputComponent from '../../forms/InputComponent';

const styles = theme => ({
    ...commonStyles(theme),
    chip: {
        marginRight: theme.spacing(1),
        marginBottom: theme.spacing(1),
    },
});

const colors = [
    '#4dd0e1',
    '#4caf50',
    '#01579b',
    '#607d8b',
    '#ffa726',
    '#ff7043',
    '#e91e63',
    '#9c27b0',
    '#f44336',
    '#2196f3',
    '#009688',
];

const getSubOrgunits = (orgUnit, orgUnitTypes, orgUnitTypesList, orgUnitTypesSelected) => {
    let newOrgUnitTypesList = [...orgUnitTypesList];
    if (orgUnit.sub_unit_types.length > 0) {
        orgUnit.sub_unit_types.forEach((subOrgUnit) => {
            const fullSubOrgUnit = orgUnitTypes.find(o => o.id === subOrgUnit.id);
            if (!newOrgUnitTypesList.find(o => o.id === subOrgUnit.id)
                && !orgUnitTypesSelected.find(os => os.id === subOrgUnit.id)) {
                newOrgUnitTypesList.push(fullSubOrgUnit);
            }
            if (fullSubOrgUnit.sub_unit_types) {
                newOrgUnitTypesList = getSubOrgunits(fullSubOrgUnit, orgUnitTypes, newOrgUnitTypesList, orgUnitTypesSelected);
            }
        });
    }
    return newOrgUnitTypesList;
};


const getOrgUnits = (orgUnitTypes, subOrgUnits) => {
    const orgUnitTypesSelected = [];
    let orgUnitTypesList = [];
    orgUnitTypes.forEach((ot) => {
        if (subOrgUnits.find(o => o.id === ot.id)) {
            orgUnitTypesSelected.push(ot);
        }
    });
    orgUnitTypesSelected.forEach((ot) => {
        orgUnitTypesList = getSubOrgunits(ot, orgUnitTypes, orgUnitTypesList, orgUnitTypesSelected);
    });
    return {
        orgUnitTypesSelected,
        orgUnitTypesList,
    };
};

class FilterOrgunitOptionComponent extends Component {
    constructor(props) {
        super(props);
        const coloredOrgUnitTypes = [];
        props.orgUnitTypes.forEach((o, i) => {
            coloredOrgUnitTypes.push({
                ...o,
                color: colors[i],
            });
        });
        this.state = {
            orgUnitTypesSelected: [],
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

        this.setState(getOrgUnits(orgUnitTypes, currentOrgUnit.org_unit_type.sub_unit_types));
    }

    onOrgUnitSelect(orgUnitId) {
        const {
            orgUnitTypes,
            orgUnitTypesSelected,
            orgUnitTypesList,
        } = this.state;
        const newOrgUnitTypesSelected = [...orgUnitTypesSelected];
        const newOrgUnitTypesList = [];
        orgUnitTypesList.forEach((o) => {
            if (o.id !== orgUnitId) {
                newOrgUnitTypesList.push(o);
            }
        });
        const newOrgUnit = orgUnitTypes.find(o => o.id === orgUnitId);
        newOrgUnitTypesSelected.push(newOrgUnit);
        this.setState({
            orgUnitTypesSelected: newOrgUnitTypesSelected,
            orgUnitTypesList: newOrgUnitTypesList,
        });
    }

    onDeleteOrgUnit(orgUnitId) {
        const {
            orgUnitTypes,
            orgUnitTypesSelected,
            orgUnitTypesList,
        } = this.state;
        const newOrgUnitTypesSelected = [];
        const newOrgUnitTypesList = [...orgUnitTypesList];
        orgUnitTypesSelected.forEach((o) => {
            if (o.id !== orgUnitId) {
                newOrgUnitTypesSelected.push(o);
            }
        });
        const deletedOrgUnit = orgUnitTypes.find(o => o.id === orgUnitId);
        newOrgUnitTypesList.push(deletedOrgUnit);
        this.setState({
            orgUnitTypesSelected: newOrgUnitTypesSelected,
            orgUnitTypesList: newOrgUnitTypesList,
        });
    }

    render() {
        const {
            currentOrgUnit,
            classes,
        } = this.props;
        const {
            orgUnitTypesSelected,
            orgUnitTypesList,
        } = this.state;
        return (
            <Fragment>
                {
                    currentOrgUnit.org_unit_type.sub_unit_types.length > 0 && (
                        <Fragment>
                            <Box
                                px={2}
                                className={classes.innerDrawerToolbar}
                                component="div"
                            >
                                <Typography variant="subtitle1">
                                    <FormattedMessage id="iaso.orgUnits.subOrgUnitsType" defaultMessage="Sub org units types" />
                                </Typography>
                            </Box>
                            <Divider light />
                            <Box
                                px={4}
                                py={2}
                                component="div"
                            >
                                {
                                    orgUnitTypesSelected.length > 0 && (
                                        orgUnitTypesSelected.map((o, i) => (
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
                            <Divider />
                        </Fragment>
                    )
                }
            </Fragment>
        );
    }
}

FilterOrgunitOptionComponent.defaultProps = {
    orgUnitTypes: [],
};

FilterOrgunitOptionComponent.propTypes = {
    classes: PropTypes.object.isRequired,
    orgUnitTypes: PropTypes.array,
    currentOrgUnit: PropTypes.object.isRequired,
};

export default withStyles(styles)(FilterOrgunitOptionComponent);
