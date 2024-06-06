/* eslint-disable camelcase */
import { Box, FormControl, List, ListItem } from '@mui/material';
import { useTheme } from '@mui/styles';
import {
    // @ts-ignore
    useSafeIntl,
} from 'bluesquare-components';
import { FieldInputProps } from 'formik';
import React, { FunctionComponent, useCallback, useMemo } from 'react';
import { MapLegend } from '../../../../../../../../hat/assets/js/apps/Iaso/components/maps/MapLegend';
import MESSAGES from '../../../../constants/messages';
import { PolioVaccine, polioVaccines } from '../../../../constants/virus';
import { MapComponent } from '../../MapComponent/MapComponent';

import {
    initialDistrict,
    selectedPathOptions,
    unselectedPathOptions,
} from '../../../../styles/constants';
import { useStyles } from '../../../../styles/theme';

import { OrgUnit } from '../../../../../../../../hat/assets/js/apps/Iaso/domains/orgUnits/types/orgUnit';
import {
    CampaignFormValues,
    Scope,
    Vaccine,
} from '../../../../constants/types';
import { Shape } from './types';
import { findScopeWithOrgUnit } from './utils';

type Props = {
    field: FieldInputProps<Scope[]>;
    values: CampaignFormValues;
    regionShapes: OrgUnit[];
    districtShapes: OrgUnit[];
    // eslint-disable-next-line no-unused-vars
    onSelectOrgUnit: (id: Shape) => void;
    selectedVaccine: string;
    // eslint-disable-next-line no-unused-vars
    setSelectedVaccine: (selected: Vaccine) => void;
    isPolio?: boolean;
    availableVaccines?: PolioVaccine[];
};

const getBackgroundLayerStyle = () => {
    return {
        color: 'grey',
        opacity: '1',
        fillColor: 'transparent',
    };
};

export const MapScope: FunctionComponent<Props> = ({
    field,
    values,
    regionShapes,
    districtShapes,
    onSelectOrgUnit,
    selectedVaccine,
    setSelectedVaccine,
    isPolio,
    availableVaccines = polioVaccines,
}) => {
    const classes: Record<string, string> = useStyles();
    const { formatMessage } = useSafeIntl();
    const theme = useTheme();
    const { value: scopes = [] } = field;
    const vaccineCount = useMemo(
        () =>
            Object.fromEntries(
                scopes.map(scope => [
                    scope.vaccine,
                    scope.group?.org_units?.length ?? 0,
                ]),
            ),
        [scopes],
    );

    const getShapeStyle = useCallback(
        shape => {
            const scope = findScopeWithOrgUnit(scopes, shape.id);

            if (scope) {
                const vaccine = availableVaccines.find(
                    v => v.value === scope.vaccine,
                );
                return {
                    ...selectedPathOptions,
                    color: vaccine?.color || theme.palette.primary.main,
                };
            }
            if (values.org_unit?.id === shape.id) return initialDistrict;
            return unselectedPathOptions;
        },
        [
            scopes,
            values.org_unit?.id,
            availableVaccines,
            theme.palette.primary.main,
        ],
    );
    const filterOrgUnits = useCallback(
        (orgUnits: OrgUnit[]) =>
            orgUnits.filter(
                orgUnit =>
                    (orgUnit.has_geo_json ||
                        (orgUnit.latitude && orgUnit.longitude)) &&
                    (orgUnit.validation_status === 'VALID' ||
                        // display REJECTED or NEW org unit if already present in a scope
                        findScopeWithOrgUnit(scopes, orgUnit.id)),
            ),
        [scopes],
    );

    const districts = useMemo(
        () => filterOrgUnits(districtShapes),
        [districtShapes, filterOrgUnits],
    );
    const regions = useMemo(
        () => filterOrgUnits(regionShapes),
        [regionShapes, filterOrgUnits],
    );

    return (
        <Box position="relative">
            <MapComponent
                name="ScopeMap"
                mainLayer={districts}
                backgroundLayer={regions}
                onSelectShape={onSelectOrgUnit}
                getMainLayerStyle={getShapeStyle}
                getBackgroundLayerStyle={getBackgroundLayerStyle}
                tooltipLabels={{
                    main: 'District',
                    background: 'Region',
                }}
                height={540}
            />
            {isPolio && (
                <MapLegend
                    titleMessage={MESSAGES.vaccine}
                    width={175}
                    content={
                        <FormControl id="vaccine">
                            <List>
                                {availableVaccines.map(vaccine => (
                                    <ListItem
                                        key={vaccine.value}
                                        button
                                        className={classes.vaccinesList}
                                        onClick={() =>
                                            setSelectedVaccine(vaccine.value)
                                        }
                                    >
                                        <Box className={classes.vaccinesSelect}>
                                            <span
                                                style={{
                                                    backgroundColor:
                                                        vaccine.color,
                                                }}
                                                className={classes.roundColor}
                                            >
                                                {selectedVaccine ===
                                                    vaccine.value && (
                                                    <span
                                                        className={
                                                            classes.roundColorInner
                                                        }
                                                    />
                                                )}
                                            </span>
                                            <span
                                                className={classes.vaccineName}
                                            >
                                                {vaccine.value}
                                            </span>

                                            <span>
                                                {`: ${
                                                    vaccineCount[
                                                        vaccine.value
                                                    ] ?? 0
                                                } ${formatMessage(
                                                    MESSAGES.districts,
                                                )}`}
                                            </span>
                                        </Box>
                                    </ListItem>
                                ))}
                            </List>
                        </FormControl>
                    }
                />
            )}
        </Box>
    );
};
