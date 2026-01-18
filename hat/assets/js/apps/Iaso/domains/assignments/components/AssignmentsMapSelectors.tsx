import React, { FunctionComponent, useCallback } from 'react';
import { Paper, Box } from '@mui/material';
import { useRedirectTo } from 'bluesquare-components';
import { OrgUnitTypeHierarchyDropdownValues } from 'Iaso/domains/orgUnits/orgUnitTypes/hooks/useGetOrgUnitTypesHierarchy';
import InputComponent from '../../../components/forms/InputComponent';
import { baseUrls } from '../../../constants/urls';
import { SxStyles } from '../../../types/general';
import MESSAGES from '../messages';
import { AssignmentParams } from '../types/assigment';

type Props = {
    params: AssignmentParams;
    orgunitTypes: OrgUnitTypeHierarchyDropdownValues;
    isFetchingOrgunitTypes: boolean;
};

const styles: SxStyles = {
    root: {
        position: 'absolute',
        top: theme => theme.spacing(1),
        right: theme => theme.spacing(1),
        zIndex: 401,
        p: 1,
        width: 250,
    },
    dropdown: {
        '& .MuiAutocomplete-input': {
            height: 8,
            padding: 5,
        },
        '& .MuiFormLabel-root ': {
            height: 38,
            fontSize: 13,
        },
        '& .MuiFormLabel-root.MuiInputLabel-outlined.MuiInputLabel-shrink ': {
            height: 25,
            top: 1,
        },
        '& .MuiFormControl-root fieldset legend': {
            fontSize: 9.5,
        },
        '& .MuiFormControl-root .MuiAutocomplete-clearIndicator ': {
            top: -2,
            visibility: 'visible',
        },
        '& .MuiFormControl-root .MuiAutocomplete-popupIndicator ': {
            top: -2,
        },
    },
};

const baseUrl = baseUrls.assignments;
export const AssignmentsMapSelectors: FunctionComponent<Props> = ({
    params,
    orgunitTypes,
    isFetchingOrgunitTypes,
}) => {
    const redirectTo = useRedirectTo();

    const handleChange = useCallback(
        (_, newOrgUnitTypeId) => {
            redirectTo(baseUrl, {
                ...params,
                parentOrgunitType: newOrgUnitTypeId,
            });
        },
        [params, redirectTo],
    );

    return (
        <Paper sx={styles.root}>
            <Box sx={styles.dropdown}>
                <InputComponent
                    type="select"
                    disabled={isFetchingOrgunitTypes}
                    keyValue="parentOrgunitType"
                    onChange={handleChange}
                    value={
                        isFetchingOrgunitTypes
                            ? undefined
                            : params.parentOrgunitType
                    }
                    label={MESSAGES.parentOrgunitType}
                    options={orgunitTypes}
                    loading={isFetchingOrgunitTypes}
                    clearable
                    withMarginTop={false}
                />
            </Box>
        </Paper>
    );
};
