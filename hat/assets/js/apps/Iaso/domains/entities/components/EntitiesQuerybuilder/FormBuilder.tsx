import React, { FunctionComponent, useCallback, useMemo } from 'react';
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
import InputComponent from 'Iaso/components/forms/InputComponent';
import { Form } from 'Iaso/domains/forms/types/forms';
import { SxStyles } from 'Iaso/types/general';
import MESSAGES from '../../messages';
import { FormState, formsOperators } from './utils';

type Props = {
    form_id?: string;
    fields?: QueryBuilderFields;
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
    handleChangeForm: (event: any, formId: string) => void;
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
    form_id,
    fields,
    logic,
    operator,
    onChange,
    deleteForm,
    deleteDisabled,
    formsList,
    isFetchingForms,
    handleChangeForm,
}) => {
    const isLoading = !fields;
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

    const formOptions = useMemo(() => {
        return (
            formsList?.map(t => ({
                label: t.name,
                value: t.form_id,
            })) || []
        );
    }, [formsList]);
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
            {isLoading && form_id && (
                <Box sx={styles.loadingContainer}>
                    <LoadingSpinner
                        size={20}
                        absolute={false}
                        transparent
                        fixed={false}
                    />
                </Box>
            )}
            {form_id && !isLoading && (
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
