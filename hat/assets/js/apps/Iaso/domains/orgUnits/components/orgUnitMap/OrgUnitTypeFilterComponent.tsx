import { Box, Typography } from '@mui/material';
import React, { FunctionComponent, useEffect, useState } from 'react';

import PropTypes from 'prop-types';

import { Select, renderTags, useSafeIntl } from 'bluesquare-components';

import MESSAGES from '../../messages';
import { getRequest } from '../../../../libs/Api';
import { openSnackBar } from '../../../../components/snackBars/EventDispatcher';
import { errorSnackBar } from '../../../../constants/snackBars';

const fetchSubOrgUnitsByType = (params, orgUnitType) => {
    return getRequest(`/api/orgunits/?${params}`)
        .then(res => ({
            ...orgUnitType,
            orgUnits: res.orgUnits,
        }))
        .catch(error => {
            openSnackBar(errorSnackBar('fetchOrgUnitsError', null, error));
            console.error('Error while fetching org unit list:', error);
        });
};

const getSubOrgunits = (
    orgUnit,
    orgUnitTypes,
    orgUnitTypesList = [] as any[],
) => {
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

type Props = {
    orgUnitTypesSelected: any;
    setOrgUnitTypesSelected: any;
    orgUnitTypes: any;
    currentOrgUnit: any;
};

const OrgUnitTypeFilterComponent: FunctionComponent<Props> = ({
    orgUnitTypesSelected,
    setOrgUnitTypesSelected,
    orgUnitTypes,
    currentOrgUnit,
}) => {
    const { formatMessage } = useSafeIntl();
    const [orgUnitTypesList, setOrgUnitTypesList] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const updateOrgUnitTypesSelected = newOrgUnitTypesSelected => {
        const promisesArray: Promise<any>[] = [];
        const oldOrgUnitsTypes: any[] = [];
        newOrgUnitTypesSelected.forEach(ot => {
            if (!ot.orgUnits) {
                promisesArray.push(
                    fetchSubOrgUnitsByType(
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
        const newOrgUnitTypesSelected: any[] = [];
        let newOrgUnitTypesList: any[] = [];
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
        updateOrgUnitTypesSelected(newOrgUnitTypesSelected);
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
