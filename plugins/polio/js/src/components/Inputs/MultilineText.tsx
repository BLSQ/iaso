import { get } from 'lodash';
import React, { FunctionComponent, useCallback } from 'react';
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
    const onChange = useCallback(
        value => {
            setFieldTouched(name, true);
            setFieldValue(name, value);
        },
        [name, setFieldTouched, setFieldValue],
    );
    return (
        <TextArea
            errors={errors}
            required={required}
            label={label}
            value={field.value}
            onChange={onChange}
        />
    );
};
