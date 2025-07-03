import React, {
    FunctionComponent,
    useCallback,
    useEffect,
    useMemo,
} from 'react';
import DeleteIcon from '@mui/icons-material/Delete';
import { Box, Grid, IconButton, Paper } from '@mui/material';
import {
    JsonLogicTree,
    JsonLogicResult,
} from '@react-awesome-query-builder/mui';
import {
    QueryBuilder,
    LoadingSpinner,
    QueryBuilderFields,
} from 'bluesquare-components';
import { isEqual } from 'lodash';
import InputComponent from 'Iaso/components/forms/InputComponent';
import { useGetFormDescriptor } from 'Iaso/domains/forms/fields/hooks/useGetFormDescriptor';
import { useGetQueryBuildersFields } from 'Iaso/domains/forms/fields/hooks/useGetQueryBuildersFields';
import { useGetPossibleFields } from 'Iaso/domains/forms/hooks/useGetPossibleFields';
import { Form } from 'Iaso/domains/forms/types/forms';
import { SxStyles } from 'Iaso/types/general';
import MESSAGES from '../../messages';
import { FormState, formsOperators } from './utils';

type Props = {
    id?: number;
    form_id?: string;
    stateFields?: QueryBuilderFields;
    logic?: JsonLogicTree;
    operator?: string;
    onChange: <K extends keyof FormState>(
        field: K,
        value: FormState[K],
    ) => void;
    deleteForm: () => void;
    deleteDisabled: boolean;
    formsList: Form[];
    isFetchingForms: boolean;
};

const styles: SxStyles = {
    root: {
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'rgba(0, 0, 0, 0.23)',
        pr: 2,
        pl: 2,
        pb: 2,
        mb: 2,
    },
    deleteButtonContainer: {
        display: 'flex',
        justifyContent: 'flex-end',
        alignItems: 'center',
    },
    deleteButton: {
        position: 'relative',
        top: theme => theme.spacing(1),
    },
    loadingContainer: {
        backgroundColor: 'grey.100',
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'rgba(0, 0, 0, 0.23)',
        height: 53,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        mt: 2,
    },
};

export const FormBuilder: FunctionComponent<Props> = ({
    id,
    form_id,
    stateFields,
    logic,
    operator,
    onChange,
    deleteForm,
    deleteDisabled,
    formsList,
    isFetchingForms,
}) => {
    const { data: formDescriptor, isFetching: isFetchingFormDescriptor } =
        useGetFormDescriptor(id);
    const { possibleFields, isFetchingForm: isFetchingPossibleFields } =
        useGetPossibleFields(id);
    const fields = useGetQueryBuildersFields(formDescriptor, possibleFields);
    const isLoading = isFetchingFormDescriptor || isFetchingPossibleFields;
    const handleChangeLogic = useCallback(
        (result: JsonLogicResult) => {
            onChange('logic', result?.logic);
        },
        [onChange],
    );

    const handleChangeOperator = useCallback(
        (_, newOperator: string) => {
            onChange('operator', newOperator);
        },
        [onChange],
    );

    const handleChangeForm = useCallback(
        (_, newFormId: string) => {
            const form = formsList?.find(t => t.form_id === newFormId);
            onChange('form_id', newFormId);
            onChange('form_name', form?.name);
            onChange('id', form?.id);
            onChange('logic', undefined);
            onChange('operator', undefined);
            onChange('fields', undefined);
        },
        [onChange, formsList],
    );

    const formOptions = useMemo(() => {
        return (
            formsList?.map(t => ({
                label: t.name,
                value: t.form_id,
            })) || []
        );
    }, [formsList]);

    useEffect(() => {
        if (!isEqual(fields, stateFields)) {
            onChange('fields', fields);
        }
    }, [fields, onChange, stateFields]);
    return (
        <Paper elevation={0} sx={styles.root}>
            <Grid container spacing={2}>
                <Grid item xs={6}>
                    <InputComponent
                        keyValue="form_id"
                        onChange={handleChangeForm}
                        disabled={isFetchingForms}
                        loading={isFetchingForms}
                        value={form_id || null}
                        type="select"
                        options={formOptions}
                        label={MESSAGES.selectForm}
                    />
                </Grid>
                <Grid item xs={2}>
                    <InputComponent
                        labelString=""
                        keyValue="operator"
                        onChange={handleChangeOperator}
                        value={operator || formsOperators[0].value}
                        type="select"
                        options={formsOperators}
                    />
                </Grid>
                <Grid item xs={4} sx={styles.deleteButtonContainer}>
                    <IconButton
                        color="secondary"
                        onClick={deleteForm}
                        disabled={deleteDisabled}
                        sx={styles.deleteButton}
                    >
                        <DeleteIcon />
                    </IconButton>
                </Grid>
            </Grid>
            {isLoading && (
                <Box sx={styles.loadingContainer}>
                    <LoadingSpinner
                        size={20}
                        absolute={false}
                        transparent
                        fixed={false}
                    />
                </Box>
            )}
            {Object.keys(fields).length > 0 && form_id && !isLoading && (
                <Box mt={2}>
                    <QueryBuilder
                        logic={logic}
                        fields={fields}
                        onChange={handleChangeLogic}
                    />
                </Box>
            )}
        </Paper>
    );
};
