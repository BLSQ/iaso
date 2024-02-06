import { Paper, FormControlLabel, Switch, Box } from '@mui/material';
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
import { SxStyles } from '../../../types/general';

type Props = {
    params: AssignmentParams;
    orgunitTypes: Array<DropdownOptions<string>>;
    isFetchingOrgUnitTypes: boolean;
};

const styles: SxStyles = {
    root: {
        position: 'absolute',
        top: theme => theme.spacing(1),
        right: theme => theme.spacing(1),
        zIndex: 401,
        p: 1,
        width: 200,
    },
    dropdown: {
        mt: 1,
        '& .MuiAutocomplete-input': {
            height: '8px',
            padding: '5px',
        },
        '& .MuiFormLabel-root ': {
            height: '38px',
        },
        '& .MuiFormLabel-root.MuiInputLabel-outlined.MuiInputLabel-shrink ': {
            height: '25px',
        },
    },
    checboxLabel: {
        fontSize: 12,
    },
    formControl: {
        m: 0,
    },
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
        <Paper sx={styles.root}>
            <FormControlLabel
                sx={styles.formControl}
                control={
                    <Switch
                        checked={Boolean(filters.parentPicking === 'true')}
                        onChange={e =>
                            handleChange(
                                'parentPicking',
                                // @ts-ignore
                                e.target.checked ? 'true' : 'false',
                            )
                        }
                        name="parentPicking"
                        color="primary"
                        size="small"
                    />
                }
                label={
                    <Box sx={styles.checboxLabel}>
                        {formatMessage(MESSAGES.parentPicking)}
                    </Box>
                }
            />
            <Box sx={styles.dropdown}>
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
            </Box>
        </Paper>
    );
};
