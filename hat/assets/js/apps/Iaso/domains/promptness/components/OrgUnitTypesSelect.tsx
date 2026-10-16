import React, { FunctionComponent, useMemo } from 'react';
import {
    Autocomplete,
    Box,
    Chip,
    CircularProgress,
    TextField,
} from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import MESSAGES from '../messages';
import { OrgUnitTypeOption } from './OrgUnitTypeOption';

type Option = { value: string; label: string };

type Props = {
    value?: string;
    onChange: (keyValue: string, value?: string) => void;
    options: Option[];
    notApplicableTypeIds: number[];
    loading?: boolean;
    helperText?: string;
};

const keyValue = 'orgUnitTypeIds';

export const OrgUnitTypesSelect: FunctionComponent<Props> = ({
    value,
    onChange,
    options,
    notApplicableTypeIds,
    loading = false,
    helperText,
}) => {
    const { formatMessage } = useSafeIntl();
    const selectedOptions = useMemo(() => {
        const selectedIds = value ? value.split(',') : [];
        return options.filter(option => selectedIds.includes(option.value));
    }, [options, value]);

    return (
        <Box mt={2}>
            <Autocomplete
                id={keyValue}
                multiple
                disableCloseOnSelect
                options={options}
                value={selectedOptions}
                loading={loading}
                onChange={(_, newOptions) =>
                    onChange(
                        keyValue,
                        newOptions.length > 0
                            ? newOptions.map(option => option.value).join(',')
                            : undefined,
                    )
                }
                isOptionEqualToValue={(option, selected) =>
                    option.value === selected.value
                }
                getOptionLabel={option => option.label}
                renderOption={(optionProps, option, { selected }) => (
                    <OrgUnitTypeOption
                        key={option.value}
                        optionProps={optionProps}
                        label={option.label}
                        selected={selected}
                        notApplicable={notApplicableTypeIds.includes(
                            Number(option.value),
                        )}
                    />
                )}
                renderTags={(tags, getTagProps) =>
                    tags.map((option, index) => (
                        <Chip
                            {...getTagProps({ index })}
                            key={option.value}
                            label={option.label}
                            size="small"
                        />
                    ))
                }
                renderInput={params => (
                    <TextField
                        {...params}
                        label={formatMessage(MESSAGES.orgUnitTypes)}
                        placeholder={
                            selectedOptions.length === 0
                                ? formatMessage(MESSAGES.allTypes)
                                : undefined
                        }
                        helperText={helperText}
                        InputLabelProps={{ shrink: true }}
                        InputProps={{
                            ...params.InputProps,
                            endAdornment: (
                                <>
                                    {loading && (
                                        <CircularProgress
                                            color="inherit"
                                            size={20}
                                        />
                                    )}
                                    {params.InputProps.endAdornment}
                                </>
                            ),
                        }}
                    />
                )}
            />
        </Box>
    );
};
