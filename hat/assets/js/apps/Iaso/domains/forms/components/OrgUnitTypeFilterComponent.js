import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { Box, Typography } from '@mui/material';

import PropTypes from 'prop-types';

import { Select, useSafeIntl, renderTags } from 'bluesquare-components';

import { fetchSubOrgUnitsByType } from '../../../utils/requests';

import MESSAGES from '../../orgUnits/messages';

const getSubOrgunits = (orgUnit, orgUnitTypes, orgUnitTypesList = []) => {
    if (orgUnit?.sub_unit_types.length > 0) {
        let newOrgUnitTypesList = [...orgUnitTypesList];
        orgUnit.sub_unit_types.forEach(subOrgUnit => {
            const fullSubOrgUnit = orgUnitTypes.find(
                o => o.id === subOrgUnit.id,
            );
            if (fullSubOrgUnit) {
                if (!newOrgUnitTypesList.find(o => o.id === subOrgUnit.id)) {
                    newOrgUnitTypesList.push(fullSubOrgUnit);
                }
                if (
                    fullSubOrgUnit?.sub_unit_types &&
                    fullSubOrgUnit.id !== orgUnit.id
                ) {
                    newOrgUnitTypesList = getSubOrgunits(
                        fullSubOrgUnit,
                        orgUnitTypes,
                        newOrgUnitTypesList,
                    );
                }
            }
        });
        return newOrgUnitTypesList;
    }
    return [];
};

const OrgUnitTypeFilterComponent = props => {
    const { formatMessage } = useSafeIntl();
    const {
        orgUnitTypesSelected,
        setOrgUnitTypesSelected,
        orgUnitTypes,
        currentOrgUnit,
    } = props;
    const dispatch = useDispatch();
    const [orgUnitTypesList, setOrgUnitTypesList] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    const updateOrgUnitTypesSelected = newOrgUnitTypesSelected => {
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
        setIsLoading(true);
        Promise.all(promisesArray).then(orgUnits => {
            const orgUnitsTypesWithData = oldOrgUnitsTypes.concat(orgUnits);
            setOrgUnitTypesSelected(orgUnitsTypesWithData);
            setIsLoading(false);
        });
    };

    const hanldeOnChange = selection => {
        if (!selection) {
            setOrgUnitTypesSelected([]);
        } else {
            updateOrgUnitTypesSelected(selection);
        }
    };

    useEffect(() => {
        const newOrgUnitTypesSelected = [];
        let newOrgUnitTypesList = [];
        orgUnitTypes.forEach(ot => {
            if (
                currentOrgUnit?.org_unit_type?.sub_unit_types.find(
                    o => o.id === ot.id,
                )
            ) {
                newOrgUnitTypesSelected.push(ot);
                if (!newOrgUnitTypesList.find(o => o.id === ot.id)) {
                    newOrgUnitTypesList.push(ot);
                }
            }

            const subsOt = getSubOrgunits(ot, orgUnitTypes, [ot]);
            const missingOt = subsOt.filter(
                out => !newOrgUnitTypesList.some(o => o.id === out.id),
            );
            newOrgUnitTypesList = newOrgUnitTypesList.concat(missingOt);
        });
        updateOrgUnitTypesSelected(newOrgUnitTypesSelected, false);
        setOrgUnitTypesList(newOrgUnitTypesList);
        return () => setOrgUnitTypesSelected([]);
    }, [orgUnitTypes]);

    return (
        <Box m={4}>
            <Box mb={2}>
                <Typography variant="body2">
                    {formatMessage(MESSAGES.ouTypesHelperText)}:
                </Typography>
            </Box>
            <Select
                keyValue="ou-types"
                label={formatMessage(MESSAGES.org_unit_type)}
                disabled={orgUnitTypesList.length === 0}
                clearable
                loading={isLoading}
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
                renderTags={renderTags(o => o.short_name || o.name)}
            />
        </Box>
    );
};

OrgUnitTypeFilterComponent.defaultProps = {
    orgUnitTypesSelected: [],
    orgUnitTypes: [],
};

OrgUnitTypeFilterComponent.propTypes = {
    orgUnitTypes: PropTypes.array,
    orgUnitTypesSelected: PropTypes.array,
    setOrgUnitTypesSelected: PropTypes.func.isRequired,
    currentOrgUnit: PropTypes.object.isRequired,
};

export default OrgUnitTypeFilterComponent;
