import React, { FunctionComponent, useMemo } from 'react';
import { Box, Paper, Typography } from '@mui/material';
import { grey } from '@mui/material/colors';
import {
    LoadingSpinner,
    textPlaceholder,
    useSafeIntl,
} from 'bluesquare-components';

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
    isFetchingOrgunitTypes?: boolean;
};

const getOrgUnitTypeLabel = (
    id: number | undefined,
    orgunitTypes: OrgUnitTypeHierarchyDropdownValues,
): string => {
    if (id === undefined || id === null) {
        return textPlaceholder;
    }
    const found = orgunitTypes?.find(o => o.value === id);
    return found?.label ?? String(id);
};

export const LQASRead: FunctionComponent<Props> = ({
    parameterValues,
    orgunitTypes,
    isFetchingOrgunitTypes,
}) => {
    const { formatMessage } = useSafeIntl();
    const criteriaOptions = useGetCriteriaOptions();

    const levels = useMemo(() => {
        const ids = parameterValues?.org_unit_type_sequence_identifiers;
        if (ids?.length) {
            return ids;
        }
        return [];
    }, [parameterValues?.org_unit_type_sequence_identifiers]);

    const getCriteriaLabel = (value: Criteria | string | undefined) => {
        if (!value) return textPlaceholder;
        const opt = criteriaOptions.find(o => o.value === value);
        return opt?.label ?? String(value);
    };

    if (isFetchingOrgunitTypes) {
        return (
            <Box minHeight={56} position="relative">
                <LoadingSpinner absolute fixed={false} />
            </Box>
        );
    }

    if (!levels.length) {
        return (
            <Typography color="text.secondary" variant="body2">
                {formatMessage(MESSAGES.noParameters)}
            </Typography>
        );
    }

    return (
        <Paper elevation={0} sx={styles.paper}>
            {levels.map((orgUnitTypeId, index) => {
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
                            } — ${getOrgUnitTypeLabel(
                                orgUnitTypeId,
                                orgunitTypes,
                            )}`}
                        </Typography>
                        <Box sx={styles.dataRow}>
                            <Typography
                                component="div"
                                sx={styles.criteriaBlock}
                                variant="body2"
                            >
                                <Box component="span" sx={styles.fieldLabel}>
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
                                <Box component="span" sx={styles.fieldLabel}>
                                    {formatMessage(MESSAGES.quantity)}
                                </Box>
                                {
                                    parameterValues.org_unit_type_quantities[
                                        index
                                    ]
                                }
                            </Typography>
                        </Box>
                        <Typography component="div" variant="body2">
                            <Box component="span" sx={styles.fieldLabel}>
                                {formatMessage(MESSAGES.excludedOrgUnits)}
                            </Box>
                            {parameterValues.org_unit_type_exceptions[index] ??
                                textPlaceholder}
                        </Typography>
                    </Paper>
                );
            })}
        </Paper>
    );
};
