import React from 'react';
import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { ArrayCheckboxInput } from 'Iaso/components/forms/ArrayCheckboxInput';

describe('ArrayCheckBox accessibility', () => {
    it('does not have violations with one item', async () => {
        const { container } = render(
            <ArrayCheckboxInput
                label={'Option A'}
                value={'A'}
                field={{
                    name: 'options',
                    value: [],
                    onBlur: vi.fn(),
                    onChange: vi.fn(),
                }}
            />,
        );

        expect(screen.getByLabelText('Option A')).toBeInTheDocument();
        const results = await axe(container);

        expect(results).toHaveNoViolations();
    });
    it('does not have violations with one item - checked', async () => {
        const { container } = render(
            <ArrayCheckboxInput
                label={'Option A'}
                value={'A'}
                field={{
                    name: 'options',
                    value: ['A'],
                    onBlur: vi.fn(),
                    onChange: vi.fn(),
                }}
            />,
        );

        expect(screen.getByLabelText('Option A')).toBeInTheDocument();
        expect(screen.getByLabelText('Option A')).toBeChecked();
        const results = await axe(container);

        expect(results).toHaveNoViolations();
    });
    it('does not have violations with multiple items', async () => {
        const field = {
            name: 'roles',
            value: [],
            onChange: vi.fn(),
            onBlur: vi.fn(),
        };

        const { container } = render(
            <>
                <ArrayCheckboxInput label="Admin" value="admin" field={field} />
                <ArrayCheckboxInput
                    label="Editor"
                    value="editor"
                    field={field}
                />
            </>,
        );

        expect(screen.getByLabelText('Admin')).toBeInTheDocument();
        expect(screen.getByLabelText('Admin')).not.toBeChecked();
        expect(screen.getByLabelText('Editor')).toBeInTheDocument();
        expect(screen.getByLabelText('Editor')).not.toBeChecked();

        const results = await axe(container);
        expect(results).toHaveNoViolations();
    });
    it('does not have violations with multiple items - checked', async () => {
        const field = {
            name: 'roles',
            value: ['admin', 'editor'],
            onChange: vi.fn(),
            onBlur: vi.fn(),
        };

        const { container } = render(
            <>
                <ArrayCheckboxInput label="Admin" value="admin" field={field} />
                <ArrayCheckboxInput
                    label="Editor"
                    value="editor"
                    field={field}
                />
            </>,
        );

        expect(screen.getByLabelText('Admin')).toBeInTheDocument();
        expect(screen.getByLabelText('Admin')).toBeChecked();
        expect(screen.getByLabelText('Editor')).toBeInTheDocument();
        expect(screen.getByLabelText('Editor')).toBeChecked();

        const results = await axe(container);
        expect(results).toHaveNoViolations();
    });
});
