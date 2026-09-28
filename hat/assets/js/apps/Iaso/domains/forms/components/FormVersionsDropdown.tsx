import React, { FunctionComponent, useEffect, useMemo } from 'react';
import { Autocomplete, TextField, Tooltip } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import { useGetFormVersionsDropdownOptions } from 'Iaso/domains/forms/hooks/useGetFormVersionsDropdownOptions';
import { getPrunedFormVersionIds } from 'Iaso/domains/forms/utils/getPrunedFormVersionIds';
import MESSAGES from 'Iaso/domains/instances/messages';

export type FormVersionsDropdownProps = {
    formIds?: string;
    value?: string | null;
    onChange: (value: string | null) => void;
    disabled?: boolean;
};

export const FormVersionsDropdown: FunctionComponent<
    FormVersionsDropdownProps
> = ({ formIds, value, onChange, disabled = false }) => {
    const { formatMessage } = useSafeIntl();

    const isDropdownDisabled = disabled || !formIds;

    const { data: formVersions = [], isFetching: fetchingFormVersions } =
        useGetFormVersionsDropdownOptions(formIds);

    const formVersionsOptions = useMemo(() => {
        if (!formIds) return [];
        const selectedFormIdsSet = new Set(
            formIds
                .split(',')
                .map(id => parseInt(id, 10))
                .filter(id => !isNaN(id)),
        );
        return formVersions.filter(version =>
            selectedFormIdsSet.has(version.formId),
        );
    }, [formVersions, formIds]);

    const selectedVersions = useMemo(() => {
        if (!value) return [];
        const idsSet = new Set(value.split(','));
        return formVersionsOptions.filter(option => idsSet.has(option.value));
    }, [value, formVersionsOptions]);

    useEffect(() => {
        if (!value) {
            return;
        }
        if (!formIds) {
            onChange(null);
            return;
        }
        if (formVersions.length > 0) {
            const prunedVersionIdsStr = getPrunedFormVersionIds(
                value,
                formIds,
                formVersions,
            );
            if (prunedVersionIdsStr !== (value ?? null)) {
                onChange(prunedVersionIdsStr);
            }
        }
    }, [formVersions, formIds, value, onChange]);

    return (
        <Tooltip
            title={!formIds ? formatMessage(MESSAGES.selectFormFirst) : ''}
            arrow
        >
            <span>
                <Autocomplete
                    multiple
                    disabled={isDropdownDisabled}
                    options={formVersionsOptions}
                    value={selectedVersions}
                    groupBy={option => option.formName}
                    getOptionLabel={option => option.label}
                    isOptionEqualToValue={(option, val) =>
                        option.value === val.value
                    }
                    loading={fetchingFormVersions}
                    onChange={(_event, newValue) => {
                        onChange(
                            newValue && newValue.length > 0
                                ? newValue.map(v => v.value).join(',')
                                : null,
                        );
                    }}
                    renderInput={params => (
                        <TextField
                            {...params}
                            label={formatMessage(MESSAGES.formVersions)}
                            placeholder=""
                        />
                    )}
                />
            </span>
        </Tooltip>
    );
};
