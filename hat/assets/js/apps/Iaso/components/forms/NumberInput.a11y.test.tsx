import React from 'react';
import { screen } from '@testing-library/react';

import { FormikProps } from 'formik';
import { axe } from 'jest-axe';
import { NumberInput } from 'Iaso/components/forms/NumberInput';
import { renderWithThemeAndIntlProvider } from '../../../../tests/helpers';

const createProps = (overrides = {}) => ({
    label: 'Age',
    field: {
        name: 'age',
        value: 12,
        onBlur: vi.fn(),
        onChange: vi.fn(),
    },
    form: {
        errors: {},
        touched: {},
        setFieldTouched: vi.fn(),
        setFieldValue: vi.fn(),
    } as Partial<FormikProps<{ age: number }>> as FormikProps<{
        age: number;
    }>,
    ...overrides,
});

describe('NumberInput a11y test', () => {
    it('does not have violation', async () => {
        const { container } = renderWithThemeAndIntlProvider(
            <NumberInput {...createProps()} />,
        );

        expect(screen.getByText('Age')).toBeVisible();

        const results = await axe(container);
        expect(results).toHaveNoViolations();
    });
});
