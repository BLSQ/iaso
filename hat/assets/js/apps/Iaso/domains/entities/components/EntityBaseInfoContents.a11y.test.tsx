import React from 'react';
import { axe } from 'jest-axe';
import { describe, expect, it } from 'vitest';

import { renderWithThemeAndIntlProvider } from '../../../../../tests/helpers';
import { EntityBaseInfoContents } from '../components/EntityBaseInfoContents';
import { Field } from '../types/fields';

describe('EntityBaseInfoContents accessibility', () => {
    it('has no accessibility violations for common entity field types', async () => {
        const fields: Field[] = [
            { key: 'name', label: 'Name', type: 'text', value: 'Ada Lovelace' },
            { key: 'age', label: 'Age', type: 'integer', value: 36 },
            {
                key: 'dob',
                label: 'Date of birth',
                type: 'date',
                value: '01/15/2020',
            },
            {
                key: 'appointment',
                label: 'Appointment time',
                type: 'time',
                value: '10:30 AM',
            },
            {
                key: 'gender',
                label: 'Gender',
                type: 'select_one',
                value: 'Female',
            },
            {
                key: 'symptoms',
                label: 'Symptoms',
                type: 'select_multiple',
                value: 'Fever - Cough',
            },
            {
                key: 'beneficiary_id',
                label: 'Barcode',
                type: 'barcode',
                value: 'ABC-123',
            },
        ];

        const { container } = renderWithThemeAndIntlProvider(
            <EntityBaseInfoContents fields={fields} />,
        );
        const results = await axe(container);
        expect(results).toHaveNoViolations();
    });

    it('has no accessibility violations with empty / placeholder values', async () => {
        const fields: Field[] = [
            { key: 'name', label: 'Name', type: 'text', value: '--' },
            { key: 'time', label: 'Time', type: 'time', value: '--' },
        ];

        const { container } = renderWithThemeAndIntlProvider(
            <EntityBaseInfoContents fields={fields} />,
        );
        const results = await axe(container);
        expect(results).toHaveNoViolations();
    });
});
