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
    Typography,
} from '@mui/material';
import { AlertProps } from '@mui/material/Alert/Alert';
import { Select, useSafeIntl } from 'bluesquare-components';
import { Field, FieldArray, useFormikContext } from 'formik';
import { FormikContextType } from 'formik/dist/types';
import { MissionFormCreateTypedRequest } from 'Iaso/api/missions';
import { NumberInput } from 'Iaso/components/forms/NumberInput';
import {
    FormsDropdownOptions,
    useGetFormsDropdownOptions,
    UseGetFormsDropdownParams,
} from 'Iaso/domains/forms/hooks/useGetFormsDropdownOptions';
import MESSAGES from '../../messages';

type MissionFormsInput = {
    params?: UseGetFormsDropdownParams;
};

type FormArrayErrorsProps = {
    errors: FormikContextType<MissionFormCreateTypedRequest>['errors'];
    touched: boolean;
} & Omit<AlertProps, 'severity'>;
const FormArrayErrors: React.FunctionComponent<FormArrayErrorsProps> = ({
    errors,
    touched,
}) => {
    return typeof errors.forms === 'string' && touched ? (
        <Alert severity={'error'}>{errors.forms}</Alert>
    ) : null;
};

export const MissionFormsBaseInput: React.FunctionComponent<
    MissionFormsInput
> = ({ params }) => {
    const { values, errors } =
        useFormikContext<MissionFormCreateTypedRequest>();
    const { data: formsOptions, isLoading } =
        useGetFormsDropdownOptions(params);
    const { formatMessage } = useSafeIntl();
    const [formOptionValue, setFormOptionValue] = React.useState<number>();
    const [availableFormOptions, setAvailableFormOptions] =
        React.useState<FormsDropdownOptions>([]);

    React.useEffect(() => {
        setAvailableFormOptions(formsOptions ?? []);
    }, [formsOptions]);

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
                    <Select
                        loading={isLoading}
                        options={availableFormOptions}
                        label={formatMessage(MESSAGES.addForm)}
                        clearable
                        withMarginTop
                        value={formOptionValue}
                        keyValue={''}
                        onChange={value => setFormOptionValue(value)}
                    />
                    <Button
                        sx={{ flexShrink: 1 }}
                        size={'small'}
                        color={'success'}
                        variant={'contained'}
                        disabled={!formOptionValue}
                        onClick={() => {
                            arrayHelpers.push({
                                form: formOptionValue,
                                min_cardinality: 1,
                                max_cardinality: undefined,
                            });
                            setFormOptionValue(undefined);
                            setAvailableFormOptions(prev =>
                                prev.filter(e => e.value !== formOptionValue),
                            );
                        }}
                        aria-label={formatMessage(MESSAGES.addForm)}
                    >
                        <AddIcon />
                    </Button>
                    <FormArrayErrors
                        errors={errors}
                        sx={{ mt: 2 }}
                        touched={arrayHelpers.form.touched.forms}
                    />

                    <List>
                        {values.forms &&
                            values.forms.length > 0 &&
                            values.forms.map((form, index) => (
                                <ListItem
                                    // as we cannot be sure that form.form will be unique, it's ok to silence it there
                                    // eslint-disable-next-line react/no-array-index-key
                                    key={`forms-${form.form}-${index}`}
                                    secondaryAction={
                                        <IconButton
                                            edge="end"
                                            aria-label="delete"
                                            color={'error'}
                                            onClick={() => {
                                                arrayHelpers.remove(index);
                                                setAvailableFormOptions(
                                                    prev => {
                                                        const relatedAvailableFormOption =
                                                            findFormOptionFromValue(
                                                                form.form,
                                                            );

                                                        return [
                                                            ...prev,
                                                            {
                                                                label: relatedAvailableFormOption?.label,
                                                                value: relatedAvailableFormOption?.value,
                                                                original:
                                                                    relatedAvailableFormOption,
                                                            } as FormsDropdownOptions[number],
                                                        ];
                                                    },
                                                );
                                            }}
                                        >
                                            <DeleteIcon />
                                        </IconButton>
                                    }
                                >
                                    <ListItemText
                                        primary={
                                            findFormOptionFromValue(form.form)
                                                ?.label
                                        }
                                        secondary={
                                            <Grid container spacing={2}>
                                                <Grid item xs={12} sm={6}>
                                                    <Field
                                                        label={formatMessage(
                                                            MESSAGES.minCardinality,
                                                        )}
                                                        name={`forms.${index}.min_cardinality`}
                                                        initialValue={1}
                                                        min={1}
                                                        component={NumberInput}
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
                                                        component={NumberInput}
                                                    />
                                                </Grid>
                                            </Grid>
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
