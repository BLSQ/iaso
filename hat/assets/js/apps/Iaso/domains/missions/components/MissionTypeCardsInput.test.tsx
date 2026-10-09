import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import type { FormikProps } from 'formik';
import type { FieldInputProps } from 'formik/dist/types';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MissionTypeDa2Enum } from 'Iaso/api/missions';
import { renderWithThemeAndIntlProvider } from '../../../../../tests/helpers';
import {
    MissionTypeCardsInput,
    MissionTypeCardsInputProps,
} from './MissionTypeCardsInput';

type MissionTypeValue =
    (typeof MissionTypeDa2Enum.enum)[keyof typeof MissionTypeDa2Enum.enum];

type FormValues = {
    mission_type: MissionTypeValue;
};

type Props = MissionTypeCardsInputProps<MissionTypeValue, FormValues>;

const createProps = (overrides: Record<string, unknown> = {}): Props =>
    ({
        label: 'Mission type',
        required: false,
        field: {
            name: 'mission_type',
            value: MissionTypeDa2Enum.enum.FORM_FILLING,
            onBlur: vi.fn(),
            onChange: vi.fn(),
        } as FieldInputProps<MissionTypeValue>,
        form: {
            errors: {},
            touched: {},
            setFieldTouched: vi.fn(),
            setFieldValue: vi.fn(),
        } as Partial<FormikProps<FormValues>> as FormikProps<FormValues>,
        ...overrides,
    }) as Props;

describe('MissionTypeCardsInput', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders the label and all mission type options', () => {
        renderWithThemeAndIntlProvider(
            <MissionTypeCardsInput {...createProps()} />,
        );

        expect(screen.getByText('Mission type')).toBeInTheDocument();
        expect(screen.getByRole('radiogroup')).toBeInTheDocument();
        expect(screen.getByRole('radio', { name: /^form$/i })).toBeChecked();
        expect(
            screen.getByRole('radio', { name: /org unit \+ form/i }),
        ).not.toBeChecked();
        expect(
            screen.getByRole('radio', { name: /entity \+ form/i }),
        ).not.toBeChecked();
    });

    it('shows a required indicator when required', () => {
        renderWithThemeAndIntlProvider(
            <MissionTypeCardsInput {...createProps({ required: true })} />,
        );

        expect(screen.getByText('*')).toBeInTheDocument();
    });

    it('selects the option matching field value', () => {
        renderWithThemeAndIntlProvider(
            <MissionTypeCardsInput
                {...createProps({
                    field: {
                        name: 'mission_type',
                        value: MissionTypeDa2Enum.enum.ENTITY_AND_FORM,
                        onBlur: vi.fn(),
                        onChange: vi.fn(),
                    },
                })}
            />,
        );

        expect(
            screen.getByRole('radio', { name: /entity \+ form/i }),
        ).toBeChecked();
        expect(
            screen.getByRole('radio', { name: /^form$/i }),
        ).not.toBeChecked();
    });

    it('updates formik and calls onChange when an option is selected', () => {
        const onChange = vi.fn();
        const props = createProps({ onChange });

        renderWithThemeAndIntlProvider(<MissionTypeCardsInput {...props} />);

        fireEvent.click(
            screen.getByRole('radio', { name: /org unit \+ form/i }),
        );

        expect(onChange).toHaveBeenCalledWith(
            'mission_type',
            MissionTypeDa2Enum.enum.ORG_UNIT_AND_FORM,
        );
        expect(props.form.setFieldTouched).toHaveBeenCalledWith(
            'mission_type',
            true,
        );
        expect(props.form.setFieldValue).toHaveBeenCalledWith(
            'mission_type',
            MissionTypeDa2Enum.enum.ORG_UNIT_AND_FORM,
        );
    });

    it('shows a validation error when the field is touched and invalid', () => {
        renderWithThemeAndIntlProvider(
            <MissionTypeCardsInput
                {...createProps({
                    form: {
                        errors: { mission_type: 'Invalid mission type' },
                        touched: { mission_type: true },
                        setFieldTouched: vi.fn(),
                        setFieldValue: vi.fn(),
                    },
                })}
            />,
        );

        expect(screen.getByRole('alert')).toHaveTextContent(
            'Invalid mission type',
        );
    });

    it('does not show a validation error when the field is not touched', () => {
        renderWithThemeAndIntlProvider(
            <MissionTypeCardsInput
                {...createProps({
                    form: {
                        errors: { mission_type: 'Invalid mission type' },
                        touched: {},
                        setFieldTouched: vi.fn(),
                        setFieldValue: vi.fn(),
                    },
                })}
            />,
        );

        expect(screen.queryByRole('alert')).toBeNull();
    });
});
