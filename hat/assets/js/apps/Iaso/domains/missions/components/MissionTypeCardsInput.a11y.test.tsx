import React from 'react';
import { screen } from '@testing-library/react';
import type { FormikProps } from 'formik';
import type { FieldInputProps } from 'formik/dist/types';
import { axe } from 'jest-axe';
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
        required: true,
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

describe('MissionTypeCardsInput a11y', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('has no violation with default selection', async () => {
        const { container } = renderWithThemeAndIntlProvider(
            <MissionTypeCardsInput {...createProps()} />,
        );

        expect(screen.getByRole('radiogroup')).toBeInTheDocument();
        expect(await axe(container)).toHaveNoViolations();
    });

    it('has no violation when another option is selected', async () => {
        const { container } = renderWithThemeAndIntlProvider(
            <MissionTypeCardsInput
                {...createProps({
                    field: {
                        name: 'mission_type',
                        value: MissionTypeDa2Enum.enum.ORG_UNIT_AND_FORM,
                        onBlur: vi.fn(),
                        onChange: vi.fn(),
                    },
                })}
            />,
        );

        expect(
            screen.getByRole('radio', { name: /org unit \+ form/i }),
        ).toBeChecked();
        expect(await axe(container)).toHaveNoViolations();
    });

    it('has no violation when showing a validation error', async () => {
        const { container } = renderWithThemeAndIntlProvider(
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

        expect(screen.getByRole('alert')).toBeInTheDocument();
        expect(await axe(container)).toHaveNoViolations();
    });
});
