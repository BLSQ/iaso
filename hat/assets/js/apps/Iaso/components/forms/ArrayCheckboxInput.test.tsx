import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ArrayCheckboxInput } from './ArrayCheckboxInput';

describe('ArrayCheckboxInput', () => {
    const createProps = (overrides = {}) => ({
        label: 'Option A',
        value: 'A',
        field: {
            name: 'options',
            value: [],
            onBlur: vi.fn(),
            onChange: vi.fn(),
        },
        form: {
            setFieldValue: vi.fn(),
        },
        ...overrides,
    });

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders the label', () => {
        render(<ArrayCheckboxInput {...createProps()} />);

        expect(screen.getByLabelText('Option A')).toBeInTheDocument();
    });

    it('is checked when value exists in the array', () => {
        render(
            <ArrayCheckboxInput
                {...createProps({
                    field: {
                        name: 'options',
                        value: ['A', 'B'],
                    },
                })}
            />,
        );

        expect(screen.getByRole('checkbox')).toBeChecked();
    });

    it('is unchecked when value does not exist in the array', () => {
        render(
            <ArrayCheckboxInput
                {...createProps({
                    field: {
                        name: 'options',
                        value: ['B'],
                    },
                })}
            />,
        );

        expect(screen.getByRole('checkbox')).not.toBeChecked();
    });

    it('treats undefined field value as an empty array', () => {
        render(
            <ArrayCheckboxInput
                {...createProps({
                    field: {
                        name: 'options',
                        value: undefined,
                    },
                })}
            />,
        );

        expect(screen.getByRole('checkbox')).not.toBeChecked();
    });

    it('adds the value when checked', () => {
        const setFieldValue = vi.fn();

        render(
            <ArrayCheckboxInput
                {...createProps({
                    field: {
                        name: 'options',
                        value: ['B'],
                    },
                    form: {
                        setFieldValue,
                    },
                })}
            />,
        );

        fireEvent.click(screen.getByRole('checkbox'));

        expect(setFieldValue).toHaveBeenCalledWith('options', ['B', 'A']);
    });

    it('removes the value when unchecked', () => {
        const setFieldValue = vi.fn();

        render(
            <ArrayCheckboxInput
                {...createProps({
                    field: {
                        name: 'options',
                        value: ['A', 'B'],
                    },
                    form: {
                        setFieldValue,
                    },
                })}
            />,
        );

        fireEvent.click(screen.getByRole('checkbox'));

        expect(setFieldValue).toHaveBeenCalledWith('options', ['B']);
    });

    it('uses custom onChange when provided', () => {
        const customOnChange = vi.fn();
        const setFieldValue = vi.fn();

        render(
            <ArrayCheckboxInput
                {...createProps({
                    onChange: customOnChange,
                    form: {
                        setFieldValue,
                    },
                })}
            />,
        );

        fireEvent.click(screen.getByRole('checkbox'));

        expect(customOnChange).toHaveBeenCalledTimes(1);
        expect(setFieldValue).not.toHaveBeenCalled();
    });

    it('passes additional FormControlLabel props', () => {
        render(<ArrayCheckboxInput {...createProps()} disabled />);

        expect(screen.getByRole('checkbox')).toBeDisabled();
    });

    const TestHarness = () => {
        const [values, setValues] = React.useState<string[]>([]);

        const field = {
            name: 'roles',
            value: values,
        };

        const form = {
            setFieldValue: (_: string, value: string[]) => {
                setValues(value);
            },
        };

        return (
            <>
                <ArrayCheckboxInput
                    label="Admin"
                    value="admin"
                    field={field}
                    form={form as any}
                />
                <ArrayCheckboxInput
                    label="Editor"
                    value="editor"
                    field={field}
                    form={form as any}
                />
            </>
        );
    };

    it('keeps multiple checkboxes in sync through the same field', () => {
        render(<TestHarness />);

        const admin = screen.getByLabelText('Admin');
        const editor = screen.getByLabelText('Editor');

        expect(admin).not.toBeChecked();
        expect(editor).not.toBeChecked();

        fireEvent.click(admin);
        expect(admin).toBeChecked();
        expect(editor).not.toBeChecked();

        fireEvent.click(editor);
        expect(admin).toBeChecked();
        expect(editor).toBeChecked();

        fireEvent.click(admin);
        expect(admin).not.toBeChecked();
        expect(editor).toBeChecked();
    });
});
