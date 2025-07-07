import React, {
    FunctionComponent,
    useEffect,
    useState,
    useMemo,
    useCallback,
} from 'react';
import { Box, Grid, Typography } from '@mui/material';

import {
    Select,
    renderTags,
    useSafeIntl,
    IconButton,
} from 'bluesquare-components';

import { openSnackBar } from '../../../../components/snackBars/EventDispatcher';
import { errorSnackBar } from '../../../../constants/snackBars';
import { getRequest } from '../../../../libs/Api';
import { getOrgUnitsBounds } from '../../../../utils/map/mapUtils';
import MESSAGES from '../../messages';
import { padding } from './OrgUnitMap/OrgUnitMap';

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
    orgUnitTypes = [] as any[],
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
    map: any;
};

const OrgUnitTypeFilterComponent: FunctionComponent<Props> = ({
    orgUnitTypesSelected,
    setOrgUnitTypesSelected,
    orgUnitTypes,
    currentOrgUnit,
    map,
}) => {
    const { formatMessage } = useSafeIntl();
    const [orgUnitTypesList, setOrgUnitTypesList] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Compute bounds automatically when orgUnitTypesSelected changes
    const computedBounds = useMemo(() => {
        const allOrgUnits = orgUnitTypesSelected.flatMap(
            ot => ot.orgUnits || [],
        );
        return getOrgUnitsBounds(allOrgUnits);
    }, [orgUnitTypesSelected]);
    const canFitToBounds =
        computedBounds && computedBounds.isValid() && map.current;
    const triggerFitBounds = useCallback(() => {
        if (canFitToBounds) {
            map.current.fitBounds(computedBounds, {
                padding,
            });
        }
    }, [computedBounds, map, canFitToBounds]);
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
            <Grid container spacing={2}>
                <Grid item xs={10}>
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
                </Grid>
                <Grid
                    item
                    xs={2}
                    display="flex"
                    justifyContent="flex-start"
                    alignItems="center"
                >
                    <IconButton
                        onClick={triggerFitBounds}
                        icon="remove-red-eye"
                        tooltipMessage={MESSAGES.fitToOutBounds}
                        disabled={!canFitToBounds}
                    />
                </Grid>
            </Grid>
        </Box>
    );
};
export default OrgUnitTypeFilterComponent;
