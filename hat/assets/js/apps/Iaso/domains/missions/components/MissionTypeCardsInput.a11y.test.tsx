import React from 'react';
import { screen } from '@testing-library/react';
import type { FormikProps } from 'formik';
import { axe } from 'jest-axe';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MissionTypeDropdownValueEnum } from 'Iaso/api/missions';
import { renderWithThemeAndIntlProvider } from '../../../../../tests/helpers';
import { MissionTypeCardsInput } from './MissionTypeCardsInput';

const createProps = (overrides: Record<string, unknown> = {}) => ({
    label: 'Mission type',
    required: true,
    field: {
        name: 'mission_type',
        value: MissionTypeDropdownValueEnum.enum.FORM_FILLING,
        onBlur: vi.fn(),
        onChange: vi.fn(),
    },
    form: {
        errors: {},
        touched: {},
        setFieldTouched: vi.fn(),
        setFieldValue: vi.fn(),
    } as Partial<FormikProps<{ mission_type: string }>> as FormikProps<{
        mission_type: string;
    }>,
    ...overrides,
});

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
                        value: MissionTypeDropdownValueEnum.enum
                            .ORG_UNIT_AND_FORM,
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
