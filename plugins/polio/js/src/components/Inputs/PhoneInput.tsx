import React, { FunctionComponent } from 'react';
import { get } from 'lodash';
import InputComponent, {
    PhoneInputOptions,
} from '../../../../../../hat/assets/js/apps/Iaso/components/forms/InputComponent';

type Props = {
    label: string;
    field: Record<string, any>;
    form: Record<string, any>;
    countryDataField?: string;
    disabled?: boolean;
    required?: boolean;
    withMarginTop?: boolean;
    phoneInputOptions?: PhoneInputOptions;
};
/**
 * Wrapper over InputComponent type phone, for use with formik field.
 * The problem with phone numbers is that we need to send both the phone number
 * and some additional country data, like the country code and or country dial code
 * otherwise it can be ambiguous, eg: how to differentiate +35 from +352.
 *
 * We use field name for the actual value (the full phone number)
 * If `countryDataField` is passed, the component will use this field in formik to save the countryData
 */
export const PhoneInput: FunctionComponent<Props> = ({
    label,
    field,
    form,
    countryDataField,
    phoneInputOptions = {},
    withMarginTop = false,
    disabled = false,
    required = false,
}) => {
    const { values } = form;
    const hasError =
        form.errors &&
        Boolean(get(form.errors, field.name) && get(form.touched, field.name));
    return (
        <InputComponent
            withMarginTop={withMarginTop}
            keyValue={field.name}
            type="phone"
            value={field.value}
            labelString={label}
            onChange={(_keyValue, value, countryData) => {
                form.setFieldTouched(field.name, true);
                if (countryDataField) {
                    form.setValues({
                        ...values,
                        [field.name]: value,
                        [countryDataField]: countryData,
                    });
                } else {
                    form.setFieldValue(field.name, value);
                }
            }}
            errors={hasError ? [get(form.errors, field.name)] : []}
            disabled={disabled}
            required={required}
            phoneInputOptions={{ ...phoneInputOptions }}
        />
    );
};
