import React from 'react';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import {
    Alert,
    Box,
    Button,
    Grid,
    IconButton,
    List,
    ListItem,
    ListItemText,
    Stack,
    Typography,
} from '@mui/material';
import { AlertProps } from '@mui/material/Alert/Alert';
import Divider from '@mui/material/Divider';
import { Select, useSafeIntl } from 'bluesquare-components';
import { Field, FieldArray } from 'formik';
import { FormikContextType, FormikProps } from 'formik/dist/types';
import { NumberInput } from 'Iaso/components/forms/NumberInput';
import {
    FormsDropdownOptions,
    useGetFormsDropdownOptions,
    UseGetFormsDropdownParams,
} from 'Iaso/domains/forms/hooks/useGetFormsDropdownOptions';
import { BaseUpdateCreateRequest } from 'Iaso/domains/missions/types';
import MESSAGES from '../../messages';

type MissionFormsInput<TSchema> = {
    params?: UseGetFormsDropdownParams;
    formik: FormikProps<TSchema>;
    formSelectProps?: {
        disabled?: boolean;
        helperText?: string;
    };
};

type FormArrayErrorsProps<TSchema> = {
    errors: FormikContextType<TSchema>['errors'];
    touched: boolean;
} & Omit<AlertProps, 'severity'>;

const FormArrayErrors = <TSchema extends BaseUpdateCreateRequest>({
    errors,
    touched,
    ...props
}: FormArrayErrorsProps<TSchema>) => {
    return typeof errors.forms === 'string' && touched ? (
        <Alert severity={'error'} {...props}>
            {errors.forms}
        </Alert>
    ) : null;
};

export const MissionFormsBaseInput = <TSchema extends BaseUpdateCreateRequest>({
    params,
    formik,
    formSelectProps,
}: MissionFormsInput<TSchema>) => {
    const { values, errors } = formik;
    const { data: formsOptions, isLoading } =
        useGetFormsDropdownOptions(params);
    const { formatMessage } = useSafeIntl();
    const [formOptionValue, setFormOptionValue] = React.useState<number>();
    const [availableFormOptions, setAvailableFormOptions] =
        React.useState<FormsDropdownOptions>([]);

    React.useEffect(() => {
        setAvailableFormOptions(
            formsOptions?.filter(
                e => !values?.forms?.map(f => f.form).includes(e.value),
            ) ?? [],
        );
    }, [formsOptions, values]);

    const findFormOptionFromValue = React.useCallback(
        (value: number) => {
            return formsOptions?.filter(e => e.value === value)?.[0];
        },
        [formsOptions],
    );

    return (
        <FieldArray
            name="forms"
            render={arrayHelpers => (
                <Box sx={{ mt: 2 }}>
                    <Typography sx={{ mb: 2 }}>
                        {formatMessage(MESSAGES.forms)} *
                    </Typography>
                    <Stack direction={'row'}>
                        <Box sx={{ width: '100%' }}>
                            <Select
                                loading={isLoading}
                                options={availableFormOptions}
                                label={formatMessage(MESSAGES.addForm)}
                                clearable
                                value={formOptionValue}
                                keyValue={''}
                                onChange={value => setFormOptionValue(value)}
                                {...formSelectProps}
                            />
                        </Box>
                        <Button
                            size={'small'}
                            color={'success'}
                            variant={'text'}
                            disabled={!formOptionValue}
                            onClick={() => {
                                arrayHelpers.push({
                                    form: formOptionValue,
                                    min_cardinality: 1,
                                    max_cardinality: undefined,
                                });
                                setFormOptionValue(undefined);
                                formik.setFieldTouched('forms', true);
                            }}
                            aria-label={formatMessage(MESSAGES.addForm)}
                        >
                            <AddIcon />
                        </Button>
                    </Stack>

                    <FormArrayErrors
                        errors={errors}
                        sx={{ mt: 2 }}
                        touched={!!arrayHelpers.form.touched.forms}
                    />

                    <Divider sx={{ my: 2 }} />

                    <List>
                        {values.forms &&
                            values.forms.length > 0 &&
                            values.forms.map((form, index) => (
                                <ListItem
                                    // as we cannot be sure that form.form will be unique, it's ok to silence it there
                                    // eslint-disable-next-line react/no-array-index-key
                                    key={`forms-${form.form}-${index}`}
                                >
                                    <ListItemText
                                        primary={
                                            findFormOptionFromValue(form.form)
                                                ?.label
                                        }
                                        secondary={
                                            <Box
                                                sx={{
                                                    display: 'flex',
                                                    flexDirection: 'row',
                                                    alignItems: 'end',
                                                }}
                                            >
                                                <Grid
                                                    container
                                                    spacing={2}
                                                    sx={{ mt: 2, mr: 2 }}
                                                >
                                                    <Grid item xs={12} sm={6}>
                                                        <Field
                                                            label={formatMessage(
                                                                MESSAGES.minCardinality,
                                                            )}
                                                            name={`forms.${index}.min_cardinality`}
                                                            initialValue={1}
                                                            min={1}
                                                            component={
                                                                NumberInput
                                                            }
                                                            required
                                                        />
                                                    </Grid>
                                                    <Grid item xs={12} sm={6}>
                                                        <Field
                                                            label={formatMessage(
                                                                MESSAGES.maxCardinality,
                                                            )}
                                                            name={`forms.${index}.max_cardinality`}
                                                            initialValue={1}
                                                            min={0}
                                                            component={
                                                                NumberInput
                                                            }
                                                        />
                                                    </Grid>
                                                </Grid>
                                                <IconButton
                                                    edge="end"
                                                    aria-label={formatMessage(
                                                        MESSAGES.delete,
                                                    )}
                                                    sx={{ mb: 1 }}
                                                    color={'error'}
                                                    onClick={() => {
                                                        arrayHelpers.remove(
                                                            index,
                                                        );
                                                        formik.setFieldTouched(
                                                            'forms',
                                                            true,
                                                        );
                                                    }}
                                                >
                                                    <DeleteIcon />
                                                </IconButton>
                                            </Box>
                                        }
                                    />
                                </ListItem>
                            ))}
                    </List>
                </Box>
            )}
        />
    );
};
