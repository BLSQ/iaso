import { Box, FormControl, List, ListItem } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import { FieldInputProps } from 'formik';
import React, { FunctionComponent, useMemo } from 'react';
import { MapLegend } from '../../../../../../../../hat/assets/js/apps/Iaso/components/maps/MapLegend';
import MESSAGES from '../../../../constants/messages';
import { PolioVaccine, polioVaccines } from '../../../../constants/virus';

import { useStyles } from '../../../../styles/theme';

import { Scope, Vaccine } from '../../../../constants/types';

type Props = {
    field: FieldInputProps<Scope[]>;
    selectedVaccine: string;
    setSelectedVaccine: (selected: Vaccine) => void;
    availableVaccines?: PolioVaccine[];
};

export const ScopeMapLegend: FunctionComponent<Props> = ({
    field,
    selectedVaccine,
    setSelectedVaccine,
    availableVaccines = polioVaccines,
}) => {
    const classes: Record<string, string> = useStyles();
    const { formatMessage } = useSafeIntl();
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
    return (
        <MapLegend
            titleMessage={MESSAGES.vaccine}
            width={190}
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
                                        style={
                                            vaccine.legendColor
                                                ? {
                                                      background:
                                                          vaccine.legendColor,
                                                  }
                                                : {
                                                      backgroundColor:
                                                          vaccine.color,
                                                  }
                                        }
                                        className={classes.roundColor}
                                    >
                                        {selectedVaccine === vaccine.value && (
                                            <span
                                                className={
                                                    classes.roundColorInner
                                                }
                                            />
                                        )}
                                    </span>
                                    <span className={classes.vaccineName}>
                                        {vaccine.value}
                                    </span>

                                    <span className={classes.vaccineCount}>
                                        {`: ${
                                            vaccineCount[vaccine.value] ?? 0
                                        } ${formatMessage(MESSAGES.districts)}`}
                                    </span>
                                </Box>
                            </ListItem>
                        ))}
                    </List>
                </FormControl>
            }
        />
    );
};
