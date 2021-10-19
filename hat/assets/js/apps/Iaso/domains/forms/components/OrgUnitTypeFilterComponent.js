import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Box, Chip } from '@material-ui/core';

import PropTypes from 'prop-types';

import { Select, useSafeIntl } from 'bluesquare-components';

import { fetchSubOrgUnitsByType } from '../../../utils/requests';

import { getOtChipColors } from '../../../constants/chipColors';

import MESSAGES from '../../orgUnits/messages';

const getSubOrgunits = (orgUnit, orgUnitTypes, orgUnitTypesList = []) => {
    let newOrgUnitTypesList = [...orgUnitTypesList];
    if (orgUnit.sub_unit_types.length > 0) {
        orgUnit.sub_unit_types.forEach(subOrgUnit => {
            const fullSubOrgUnit = orgUnitTypes.find(
                o => o.id === subOrgUnit.id,
            );
            if (!newOrgUnitTypesList.find(o => o.id === subOrgUnit.id)) {
                newOrgUnitTypesList.push(fullSubOrgUnit);
            }
            if (
                fullSubOrgUnit.sub_unit_types &&
                fullSubOrgUnit.id !== orgUnit.id
            ) {
                newOrgUnitTypesList = getSubOrgunits(
                    fullSubOrgUnit,
                    orgUnitTypes,
                    newOrgUnitTypesList,
                );
            }
        });
    }
    return newOrgUnitTypesList;
};

const OrgUnitTypeFilterComponent = props => {
    const { formatMessage } = useSafeIntl();
    const { orgUnitTypesSelected, setOrgUnitTypesSelected, fitToBounds } =
        props;
    const dispatch = useDispatch();
    const orgUnitTypes = useSelector(state => state.orgUnits.orgUnitTypes);
    const currentOrgUnit = useSelector(state => state.orgUnits.current);
    const [orgUnitTypesList, setOrgUnitTypesList] = useState([]);
    const updateOrgUnitTypesSelected = (
        newOrgUnitTypesSelected,
        fitToBoundsAction = true,
    ) => {
        const promisesArray = [];
        const oldOrgUnitsTypes = [];
        newOrgUnitTypesSelected.forEach(ot => {
            if (!ot.orgUnits) {
                promisesArray.push(
                    fetchSubOrgUnitsByType(
                        dispatch,
                        `&orgUnitParentId=${currentOrgUnit.id}&orgUnitTypeId=${ot.id}&withShapes=true&validation_status=all`,
                        ot,
                    ),
                );
            } else {
                oldOrgUnitsTypes.push(ot);
            }
        });
        Promise.all(promisesArray).then(orgUnits => {
            const orgUnitsTypesWithData = oldOrgUnitsTypes.concat(orgUnits);
            setOrgUnitTypesSelected(orgUnitsTypesWithData);
            if (fitToBoundsAction) {
                fitToBounds();
            }
        });
    };

    const hanldeOnChange = selection => {
        if (!selection) {
            setOrgUnitTypesSelected([]);
        } else {
            const newOrgUnitTypesSelected = [...selection];
            newOrgUnitTypesSelected.forEach((ot, index) => {
                newOrgUnitTypesSelected[index].color = getOtChipColors(index);
            });
            updateOrgUnitTypesSelected(newOrgUnitTypesSelected);
        }
    };

    useEffect(() => {
        const newOrgUnitTypesSelected = [];
        orgUnitTypes.forEach(ot => {
            if (
                currentOrgUnit.org_unit_type &&
                currentOrgUnit.org_unit_type.sub_unit_types.find(
                    o => o.id === ot.id,
                )
            ) {
                newOrgUnitTypesSelected.push(ot);
            }
        });
        newOrgUnitTypesSelected.forEach((ot, index) => {
            newOrgUnitTypesSelected[index].color = getOtChipColors(index);
        });
        const newOrgUnitTypesList = getSubOrgunits(
            newOrgUnitTypesSelected[0],
            orgUnitTypes,
            [newOrgUnitTypesSelected[0]],
        );
        updateOrgUnitTypesSelected(newOrgUnitTypesSelected, false);
        setOrgUnitTypesList(newOrgUnitTypesList);
        return () => setOrgUnitTypesSelected([]);
    }, []);

    return (
        <>
            <Box m={4}>
                <Select
                    keyValue="forms"
                    label={formatMessage(MESSAGES.title)}
                    disabled={orgUnitTypesList.length === 0}
                    clearable
                    multi
                    value={orgUnitTypesSelected}
                    getOptionLabel={option => option && option.name}
                    getOptionSelected={(option, val) => {
                        return val && option.id === val.id;
                    }}
                    options={orgUnitTypesList}
                    returnFullObject
                    onChange={newValue => {
                        hanldeOnChange(newValue);
                    }}
                    renderTags={(tagValue, getTagProps) =>
                        tagValue
                            .filter(option => option)
                            .map((option, index) => (
                                <Chip
                                    style={{
                                        backgroundColor: option.color,
                                        color: 'white',
                                    }}
                                    label={option.short_name || option.name}
                                    {...getTagProps({ index })}
                                />
                            ))
                    }
                />
            </Box>
        </>
    );
};

OrgUnitTypeFilterComponent.defaultProps = {
    orgUnitTypesSelected: [],
};

OrgUnitTypeFilterComponent.propTypes = {
    orgUnitTypesSelected: PropTypes.array,
    setOrgUnitTypesSelected: PropTypes.func.isRequired,
    fitToBounds: PropTypes.func.isRequired,
};

export default OrgUnitTypeFilterComponent;
