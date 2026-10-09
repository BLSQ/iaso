import React from 'react';
import { screen } from '@testing-library/react';

import { FormikProps } from 'formik';
import { axe } from 'jest-axe';
import { SelectInput } from 'Iaso/components/forms/SelectInput';
import { renderWithThemeAndIntlProvider } from '../../../../tests/helpers';

const options = [
    {
        value: 'cat',
        label: 'Cat',
    },
    {
        value: 'dog',
        label: 'Dog',
    },
];

const createProps = (overrides = {}) => ({
    label: 'Animal',
    options,
    field: {
        name: 'animal',
        value: 'cat',
        onBlur: vi.fn(),
        onChange: vi.fn(),
    },
    form: {
        errors: {},
        touched: {},
        setFieldTouched: vi.fn(),
        setFieldValue: vi.fn(),
    } as Partial<FormikProps<{ animal: string }>> as FormikProps<{
        animal: string;
    }>,
    ...overrides,
});
describe('SelectInput a11y test', () => {
    it('has no violations', async () => {
        const { container } = renderWithThemeAndIntlProvider(
            <SelectInput {...createProps()} />,
        );
        expect(screen.getAllByText('Animal')).not.toBeNull();
        expect(await axe(container)).toHaveNoViolations();
    });
});
