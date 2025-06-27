import React, {
    FunctionComponent,
    useCallback,
    useMemo,
    useState,
} from 'react';
import DeleteIcon from '@mui/icons-material/Delete';
import { Box, Button, Grid, IconButton, Paper } from '@mui/material';
import {
    JsonLogicTree,
    JsonLogicResult,
} from '@react-awesome-query-builder/mui';
import { useHumanReadableJsonLogic, QueryBuilder } from 'bluesquare-components';
import InputComponent from 'Iaso/components/forms/InputComponent';
import { useGetFormDescriptor } from 'Iaso/domains/forms/fields/hooks/useGetFormDescriptor';
import { useGetQueryBuilderListToReplace } from 'Iaso/domains/forms/fields/hooks/useGetQueryBuilderListToReplace';
import { useGetQueryBuildersFields } from 'Iaso/domains/forms/fields/hooks/useGetQueryBuildersFields';
import { useGetPossibleFields } from 'Iaso/domains/forms/hooks/useGetPossibleFields';
import { useGetForms } from '../../entityTypes/hooks/requests/forms';
import MESSAGES from '../../messages';

type Props = {
    formId?: string;
    changeForm: (formId: string) => void;
    initialLogic?: JsonLogicTree;
    deleteForm: () => void;
    deleteDisabled: boolean;
};

const formsOperators = [
    {
        label: 'Some',
        value: 'some',
    },
    {
        label: 'All',
        value: 'all',
    },
    {
        label: 'None',
        value: 'none',
    },
];

export const FormBuilder: FunctionComponent<Props> = ({
    formId,
    changeForm,
    initialLogic,
    deleteForm,
    deleteDisabled,
}) => {
    const handleChangeForm = (_, newFormId: string) => {
        changeForm(newFormId);
    };

    const [logic, setLogic] = useState<JsonLogicTree | undefined>(initialLogic);
    const [not, setNot] = useState<boolean>(false);
    const [operator, setOperator] = useState<string | undefined>(undefined);
    const { data: formsList, isFetching: isFetchingForms } = useGetForms(true);
    const { data: formDescriptor } = useGetFormDescriptor(
        formId ? parseInt(formId, 10) : undefined,
    );
    const { possibleFields } = useGetPossibleFields(
        formId ? parseInt(formId, 10) : undefined,
    );
    const fields = useGetQueryBuildersFields(formDescriptor, possibleFields);
    const queryBuilderListToReplace = useGetQueryBuilderListToReplace();
    const getHumanReadableJsonLogic = useHumanReadableJsonLogic(
        fields,
        queryBuilderListToReplace,
    );
    const handleChangeLogic = useCallback((result: JsonLogicResult) => {
        setLogic(result?.logic);
    }, []);
    const handleChangeOperator = useCallback((_, newOperator: string) => {
        setOperator(newOperator);
    }, []);
    const formOptions = useMemo(() => {
        return (
            formsList?.map(t => ({
                label: t.name,
                value: t.id,
            })) || []
        );
    }, [formsList]);
    console.log('fields', fields);
    return (
        <Paper
            elevation={0}
            sx={{
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'rgba(0, 0, 0, 0.23)',
                pr: 2,
                pl: 2,
                pb: 2,
                mb: 2,
            }}
        >
            <Grid container spacing={2}>
                <Grid
                    item
                    xs={1}
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <Button
                        variant="outlined"
                        size="small"
                        sx={{
                            position: 'relative',
                            top: theme => theme.spacing(1),
                            color: not ? 'white' : 'inherit',
                            borderColor: not
                                ? 'secondary.main'
                                : 'rgba(0, 0, 0, 0.03)',
                            p: theme => theme.spacing(0.5, 1),
                            minWidth: 0,
                            backgroundColor: not
                                ? 'error.main'
                                : 'rgb(224, 224, 224)',
                            '&:hover': {
                                borderColor: not
                                    ? 'secondary.main'
                                    : 'rgba(0, 0, 0, 0.03)',
                            },
                        }}
                        onClick={() => setNot(!not)}
                    >
                        NOT
                    </Button>
                </Grid>
                <Grid item xs={6}>
                    <InputComponent
                        keyValue="form_id"
                        onChange={handleChangeForm}
                        disabled={isFetchingForms}
                        loading={isFetchingForms}
                        value={formId || null}
                        type="select"
                        options={formOptions}
                        label={MESSAGES.selectForm}
                    />
                </Grid>
                <Grid item xs={2}>
                    <InputComponent
                        keyValue="operator"
                        onChange={handleChangeOperator}
                        value={operator || formsOperators[0].value}
                        type="select"
                        options={formsOperators}
                    />
                </Grid>
                <Grid
                    item
                    xs={3}
                    sx={{
                        display: 'flex',
                        justifyContent: 'flex-end',
                        alignItems: 'center',
                    }}
                >
                    <IconButton
                        color="secondary"
                        onClick={deleteForm}
                        disabled={deleteDisabled}
                        sx={{
                            position: 'relative',
                            top: theme => theme.spacing(1),
                        }}
                    >
                        <DeleteIcon />
                    </IconButton>
                </Grid>
            </Grid>

            {Object.keys(fields).length > 0 && (
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
