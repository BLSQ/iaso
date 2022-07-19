/* eslint-disable camelcase */
import React, { FunctionComponent } from 'react';
import { Field } from 'formik';
import { ScopeInput } from '../components/Inputs/ScopeInput';

export const ScopeForm: FunctionComponent = () => {
    return <Field name="scopes" component={ScopeInput} />;
};
