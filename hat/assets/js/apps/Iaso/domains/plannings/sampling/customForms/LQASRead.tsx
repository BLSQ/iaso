import React, { FunctionComponent } from 'react';
import { Box, Paper, Typography } from '@mui/material';
import { grey } from '@mui/material/colors';
import { textPlaceholder, useSafeIntl } from 'bluesquare-components';

import { OrgUnitTypeHierarchyDropdownValues } from 'Iaso/domains/orgUnits/orgUnitTypes/hooks/useGetOrgUnitTypesHierarchy';
import { SxStyles } from 'Iaso/types/general';

import MESSAGES from '../../messages';
import { Criteria } from '../types';
import { useGetCriteriaOptions } from './constants';
import { ParameterValues } from './LQASForm';

const styles: SxStyles = {
    paper: {
        backgroundColor: grey[200],
        p: 1,
        borderRadius: 1,
    },
    subPaper: {
        backgroundColor: 'white',
        px: 1.25,
        py: 0.75,
        borderRadius: 1,
        '&:not(:first-of-type)': {
            mt: 0.75,
        },
    },
    fieldLabel: {
        color: 'text.secondary',
        fontWeight: 600,
        mr: 0.5,
        whiteSpace: 'nowrap',
    },
    levelHeading: {
        mb: 0.5,
        lineHeight: 1.3,
    },
    dataRow: {
        display: 'flex',
        flexWrap: 'nowrap',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        width: '100%',
        columnGap: 1,
    },
    criteriaBlock: {
        minWidth: 0,
        flex: '1 1 auto',
        pr: 1,
    },
    quantityBlock: {
        flexShrink: 0,
        textAlign: 'right',
    },
};

type Props = {
    parameterValues: ParameterValues;
    orgunitTypes: OrgUnitTypeHierarchyDropdownValues;
};

export const LQASRead: FunctionComponent<Props> = ({
    parameterValues,
    orgunitTypes,
}) => {
    const { formatMessage } = useSafeIntl();
    const criteriaOptions = useGetCriteriaOptions();

    const getCriteriaLabel = (value: Criteria | undefined) => {
        if (!value) return textPlaceholder;
        const opt = criteriaOptions.find(o => o.value === value);
        return opt?.label ?? `${value}`;
    };

    return (
        <Paper elevation={0} sx={styles.paper}>
            {parameterValues.org_unit_type_sequence_identifiers.map(
                (orgUnitTypeId, index) => {
                    const currentOrgUnitType = orgunitTypes?.find(
                        o => o.value === orgUnitTypeId,
                    );
                    return (
                        <Paper
                            key={orgUnitTypeId}
                            elevation={0}
                            sx={styles.subPaper}
                        >
                            <Typography
                                color="primary"
                                sx={styles.levelHeading}
                                variant="subtitle2"
                            >
                                {`${formatMessage(MESSAGES.level)} ${
                                    index + 1
                                }${currentOrgUnitType?.label ? ` — ${currentOrgUnitType.label}` : ''}`}
                            </Typography>
                            <Box sx={styles.dataRow}>
                                <Typography
                                    component="div"
                                    sx={styles.criteriaBlock}
                                    variant="body2"
                                >
                                    <Box
                                        component="span"
                                        sx={styles.fieldLabel}
                                    >
                                        {formatMessage(MESSAGES.criteria)}
                                    </Box>
                                    {getCriteriaLabel(
                                        parameterValues.org_unit_type_criteria[
                                            index
                                        ],
                                    )}
                                </Typography>
                                <Typography
                                    component="div"
                                    sx={styles.quantityBlock}
                                    variant="body2"
                                >
                                    <Box
                                        component="span"
                                        sx={styles.fieldLabel}
                                    >
                                        {formatMessage(MESSAGES.quantity)}
                                    </Box>
                                    {
                                        parameterValues
                                            .org_unit_type_quantities[index]
                                    }
                                </Typography>
                            </Box>
                            <Typography component="div" variant="body2">
                                <Box component="span" sx={styles.fieldLabel}>
                                    {formatMessage(MESSAGES.excludedOrgUnits)}
                                </Box>
                                {parameterValues.org_unit_type_exceptions[
                                    index
                                ] ?? textPlaceholder}
                            </Typography>
                        </Paper>
                    );
                },
            )}
        </Paper>
    );
};
