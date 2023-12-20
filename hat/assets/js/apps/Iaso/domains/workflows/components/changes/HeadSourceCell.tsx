import React, { FunctionComponent, useMemo } from 'react';
import { Box, Grid } from '@mui/material';

import MESSAGES from '../../messages';
import InputComponent from '../../../../components/forms/InputComponent';

import { useGetForms } from '../../hooks/requests/useGetForms';

import { Change } from '../../types';
import { DropdownOptions } from '../../../../types/utils';

type Props = {
    // eslint-disable-next-line no-unused-vars
    handleChangeForm: (_, value: string) => void;
    changes?: Change[];
    change?: Change;
    form?: number;
    // eslint-disable-next-line no-unused-vars
    handleChangeSourceVersion: (_, value: string) => void;
    sourceVersion: string;
    sourceVersionsDropdownOptions: DropdownOptions<string>[];
};

export const HeadSourceCell: FunctionComponent<Props> = ({
    handleChangeForm,
    changes,
    change,
    form,
    handleChangeSourceVersion,
    sourceVersion,
    sourceVersionsDropdownOptions,
}) => {
    const { data: forms, isLoading: isLoadingForms } = useGetForms();
    const formsList = useMemo(
        () =>
            forms
                // remove already selected forms
                ?.filter(
                    f =>
                        !changes?.find(ch => ch.form.id === f.id) ||
                        change?.form.id === f.id,
                )
                .map(f => ({
                    label: f.name,
                    value: f.id,
                })) || [],
        [change?.form.id, changes, forms],
    );
    return (
        <Box mb={2}>
            <Grid container spacing={2}>
                <Grid item xs={12} md={7}>
                    <InputComponent
                        type="select"
                        keyValue="forms"
                        onChange={handleChangeForm}
                        value={form}
                        label={MESSAGES.sourceForm}
                        required
                        options={formsList}
                        loading={isLoadingForms}
                        clearable={false}
                    />
                </Grid>
                <Grid item xs={12} md={5}>
                    <InputComponent
                        type="select"
                        keyValue="sourceVersion"
                        onChange={handleChangeSourceVersion}
                        value={sourceVersion}
                        label={MESSAGES.sourceVersion}
                        options={sourceVersionsDropdownOptions}
                        clearable={false}
                    />
                </Grid>
            </Grid>
        </Box>
    );
};
