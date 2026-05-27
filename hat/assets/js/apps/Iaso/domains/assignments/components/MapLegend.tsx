import React, {
    Dispatch,
    FunctionComponent,
    SetStateAction,
    useCallback,
} from 'react';
import {
    Paper,
    Typography,
    Box,
    FormControlLabel,
    Checkbox,
    FormGroup,
} from '@mui/material';
import { makeStyles } from '@mui/styles';

import { useSafeIntl } from 'bluesquare-components';
import {
    OrgUnitTypeHierarchyDropdownValue,
    OrgUnitTypeHierarchyDropdownValues,
} from 'Iaso/domains/orgUnits/orgUnitTypes/hooks/useGetOrgUnitTypesHierarchy';
import MESSAGES from '../messages';

const useStyles = makeStyles(theme => ({
    root: {
        position: 'absolute', // assuming you have a parent relative
        zIndex: 500,
    },
    mapLegendTitle: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    roundColor: {
        borderRadius: theme.spacing(2),
        height: theme.spacing(2),
        width: theme.spacing(2),
        display: 'inline-block',
        marginRight: theme.spacing(1),
    },
    mapLegendLabel: {
        textAlign: 'right',
        display: 'inline-block',
        verticalAlign: 'top',
    },
}));

export type Legend = {
    value: string;
    label: string;
    color: string; // has to be an hexa color
};

type Props = {
    orgUniTypeList: OrgUnitTypeHierarchyDropdownValues;
    selectedOrgUnitType: OrgUnitTypeHierarchyDropdownValue[];
    setSelectedOrgUnitType: Dispatch<
        SetStateAction<OrgUnitTypeHierarchyDropdownValue[]>
    >;
};

export const MapLegend: FunctionComponent<Props> = ({
    orgUniTypeList,
    selectedOrgUnitType,
    setSelectedOrgUnitType,
}) => {
    const classes = useStyles();
    const { formatMessage } = useSafeIntl();
    const handleToggle = useCallback(
        (orgUnitType: OrgUnitTypeHierarchyDropdownValue) => {
            setSelectedOrgUnitType(current => {
                const isSelected = current.some(
                    ou => ou.value === orgUnitType.value,
                );
                if (isSelected) {
                    return current.filter(ou => ou.value !== orgUnitType.value);
                }
                return [...current, orgUnitType];
            });
        },
        [setSelectedOrgUnitType],
    );

    return (
        <Paper
            elevation={1}
            className={classes.root}
            style={{ right: 16, bottom: 16, width: 300 }}
        >
            <Box p={2}>
                <Typography
                    variant="subtitle1"
                    className={classes.mapLegendTitle}
                >
                    {formatMessage(MESSAGES.orgUnitType)}
                </Typography>
                <FormGroup>
                    {orgUniTypeList.map(ou => (
                        <FormControlLabel
                            key={ou.value}
                            control={
                                <Checkbox
                                    size="small"
                                    checked={selectedOrgUnitType.some(
                                        selected => selected.value === ou.value,
                                    )}
                                    onChange={() => handleToggle(ou)}
                                />
                            }
                            label={
                                <span className={classes.mapLegendLabel}>
                                    {ou.label}
                                </span>
                            }
                        />
                    ))}
                </FormGroup>
            </Box>
        </Paper>
    );
};
