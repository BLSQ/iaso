import { Grid, FormControlLabel, Switch, Box } from '@mui/material';
import { useDispatch } from 'react-redux';
import React, { FunctionComponent, useEffect } from 'react';
import {
    // @ts-ignore
    useSafeIntl,
} from 'bluesquare-components';

import { baseUrls } from '../../../constants/urls';
import InputComponent from '../../../components/forms/InputComponent';

import { useFilterState } from '../../../hooks/useFilterState';

import { DropdownOptions } from '../../../types/utils';
import { AssignmentParams } from '../types/assigment';

import MESSAGES from '../messages';

import { redirectTo } from '../../../routing/actions';

type Props = {
    params: AssignmentParams;
    orgunitTypes: Array<DropdownOptions<string>>;
    isFetchingOrgUnitTypes: boolean;
};

const baseUrl = baseUrls.assignments;
export const AssignmentsMapSelectors: FunctionComponent<Props> = ({
    params,
    orgunitTypes,
    isFetchingOrgUnitTypes,
}) => {
    const { filters, handleChange } = useFilterState({
        baseUrl,
        params,
        withPagination: false,
    });
    const dispatch = useDispatch();
    const { formatMessage } = useSafeIntl();

    useEffect(() => {
        if (
            filters.parentPicking !== params.parentPicking ||
            filters.parentOrgunitType !== params.parentOrgunitType
        ) {
            const tempParams = {
                ...params,
                ...filters,
            };
            dispatch(redirectTo(baseUrl, tempParams));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dispatch, filters]);

    return (
        <Box p={2}>
            <Grid container spacing={2}>
                <Grid item xs={6}>
                    <Box
                        display="flex"
                        alignItems="center"
                        height="100%"
                        justifyContent="flex-end"
                    >
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={Boolean(
                                        filters.parentPicking === 'true',
                                    )}
                                    onChange={e =>
                                        handleChange(
                                            'parentPicking',
                                            // @ts-ignore
                                            e.target.checked ? 'true' : 'false',
                                        )
                                    }
                                    name="parentPicking"
                                    color="primary"
                                />
                            }
                            label={formatMessage(MESSAGES.parentPicking)}
                        />
                    </Box>
                </Grid>
                <Grid
                    item
                    xs={6}
                    sx={{
                        '& .MuiAutocomplete-input': {
                            height: '8px',
                            padding: '5px',
                        },
                        '& .MuiFormLabel-root ': {
                            height: '38px',
                        },
                        '& .MuiFormLabel-root.MuiInputLabel-outlined.MuiInputLabel-shrink ':
                            {
                                height: '25px',
                            },
                    }}
                >
                    <InputComponent
                        type="select"
                        disabled={
                            Boolean(filters.parentPicking === 'false') ||
                            isFetchingOrgUnitTypes
                        }
                        keyValue="parentOrgunitType"
                        onChange={handleChange}
                        value={
                            isFetchingOrgUnitTypes
                                ? undefined
                                : filters.parentOrgunitType
                        }
                        label={MESSAGES.parentOrgunitType}
                        options={orgunitTypes}
                        loading={isFetchingOrgUnitTypes}
                        clearable={false}
                        withMarginTop={false}
                    />
                </Grid>
            </Grid>
        </Box>
    );
};
