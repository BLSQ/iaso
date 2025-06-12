import React, { FunctionComponent, useEffect } from 'react';
import { Box, FormHelperText, Grid } from '@mui/material';
import { useSafeIntl } from 'bluesquare-components';
import { useFieldsToExport } from 'Iaso/domains/dataSources/utils';
import InputComponent from '../../../components/forms/InputComponent';
import { DropdownOptions } from '../../../types/utils';
import {
    commaSeparatedIdsToArray,
    commaSeparatedIdsToStringArray,
} from '../../../utils/forms';
import { OrgUnitTreeviewModal } from '../../orgUnits/components/TreeView/OrgUnitTreeviewModal';
import MESSAGES from '../messages';

type Field = {
    key: string;
    value: any;
    errors: any[];
    isLoading?: boolean;
    options?: DropdownOptions<string | number>[];
    required?: boolean;
    disabled?: boolean;
};

export type VersionFields = {
    version: Field;
    status: Field;
    orgUnitTypes: Field;
    orgUnit: Field;
    group: Field;
};

type Props = {
    fields: VersionFields;
    onChange: (keyValue: string, value: any) => void;
    resetTrigger: boolean;
    showExportFields?: boolean;
    exportData?: any;
    setExportDataField?: any;
};

export const VersionPicker: FunctionComponent<Props> = ({
    fields: { version, status, orgUnitTypes, orgUnit, group },
    onChange,
    resetTrigger,
    showExportFields = false,
    exportData,
    setExportDataField,
}) => {
    const { formatMessage } = useSafeIntl();
    const fieldsToExport = useFieldsToExport();
    // Reset the group field when the version changes
    useEffect(() => {
        if (resetTrigger) {
            onChange(group.key, undefined);
        }
    }, [resetTrigger, onChange, group.key]);
    return (
        <>
            <Grid xs={6} item>
                <InputComponent
                    type="select"
                    keyValue={version.key}
                    labelString={formatMessage(MESSAGES.version)}
                    value={version.value}
                    errors={version.errors}
                    onChange={onChange}
                    options={version.options}
                    withMarginTop={false}
                    required={version.required}
                />
                <InputComponent
                    type="select"
                    labelString={formatMessage(MESSAGES.status)}
                    keyValue={status.key}
                    value={status.value}
                    errors={status.errors}
                    onChange={onChange}
                    loading={status.isLoading}
                    options={status.options}
                    required={status.required}
                />
                {showExportFields && (
                    <InputComponent
                        type="select"
                        keyValue="fields_to_export"
                        labelString={formatMessage(MESSAGES.fieldsToExport)}
                        value={exportData.fields_to_export.value}
                        errors={exportData.fields_to_export.errors}
                        onChange={(keyValue, newValue) => {
                            setExportDataField(
                                keyValue,
                                commaSeparatedIdsToStringArray(newValue),
                            );
                        }}
                        options={fieldsToExport}
                        multi
                        required
                    />
                )}
            </Grid>
            <Grid xs={6} item>
                <Box mt={-2}>
                    <OrgUnitTreeviewModal
                        onConfirm={value => {
                            onChange(orgUnit.key, value?.id ?? null);
                        }}
                        version={version.value}
                        titleMessage={formatMessage(MESSAGES.selectTopOrgUnit)}
                        resetTrigger={resetTrigger}
                        hardReset
                        required={orgUnit.required}
                        disabled={orgUnit.disabled}
                    />
                    {orgUnit.disabled && (
                        <FormHelperText sx={{ mt: -1.5 }}>
                            {formatMessage(MESSAGES.pleaseSelectVersionFirst)}
                        </FormHelperText>
                    )}
                </Box>
                <InputComponent
                    type="select"
                    keyValue={orgUnitTypes.key}
                    labelString={formatMessage(MESSAGES.orgUnitTypes)}
                    value={orgUnitTypes.value}
                    errors={orgUnitTypes.errors}
                    onChange={(keyValue, newValue) => {
                        onChange(keyValue, commaSeparatedIdsToArray(newValue));
                    }}
                    loading={orgUnitTypes.isLoading}
                    options={orgUnitTypes.options}
                    multi
                    required={orgUnitTypes.required}
                />
                <Box>
                    <InputComponent
                        type="select"
                        labelString={formatMessage(MESSAGES.group)}
                        keyValue={group.key}
                        value={group.value}
                        errors={group.errors}
                        onChange={onChange}
                        loading={group.isLoading}
                        options={group.options}
                        required={group.required}
                        disabled={group.disabled}
                    />
                    {group.disabled && (
                        <FormHelperText>
                            {formatMessage(MESSAGES.pleaseSelectVersionFirst)}
                        </FormHelperText>
                    )}
                </Box>
            </Grid>
        </>
    );
};
