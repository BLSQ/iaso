import { get } from 'lodash';
import React, { FunctionComponent } from 'react';
import { TextArea } from '../../../../../../hat/assets/js/apps/Iaso/components/forms/TextArea';

type Props = {
    field: any;
    form: any;
    label: string;
    required: boolean;
};

export const MultilineText: FunctionComponent<Props> = ({
    field,
    form,
    label,
    required,
}) => {
    const { name } = field;
    const {
        setFieldValue,
        touched,
        errors: formErrors,
        setFieldTouched,
    } = form;
    const hasError =
        form.errors && Boolean(get(formErrors, name) && get(touched, name));
    const errors = hasError ? [get(formErrors, name)] : [];
    return (
        <TextArea
            errors={errors}
            required={required}
            label={label}
            value={field.value}
            onChange={value => {
                setFieldTouched(name, true);
                setFieldValue(name, value);
            }}
        />
    );
};
