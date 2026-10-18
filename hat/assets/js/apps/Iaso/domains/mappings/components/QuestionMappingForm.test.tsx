import React from 'react';
import { fireEvent, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithThemeAndIntlProvider } from '../../../../../tests/helpers';
import { ORG_UNIT_IASO_FIELD, VALUE_FROM_FORM } from '../utils';
import QuestionMappingForm from './QuestionMappingForm';

const facility = {
    dataElement: {
        id: 'deFacility',
        name: 'Facility',
        valueType: 'ORGANISATION_UNIT',
    },
    programStage: 'stageBelgium',
};
const weight = {
    dataElement: { id: 'deWeight', name: 'Weight', valueType: 'NUMBER' },
    programStage: 'stageBelgium',
};

// no DHIS2 call: shows which search is offered and proposes fixed targets
vi.mock('./Dhis2SearchComponent', () => ({
    default: ({
        label,
        onChange,
    }: {
        label: string;
        onChange: (name: string, value: Record<string, any>) => void;
    }) => (
        <div>
            {label}
            <button type="button" onClick={() => onChange('de', facility)}>
                propose facility
            </button>
            <button type="button" onClick={() => onChange('de', weight)}>
                propose weight
            </button>
        </div>
    ),
}));

const mappingVersion = {
    mapping: { mapping_type: 'EVENT_TRACKER', data_source: { id: 1 } },
    derivate_settings: { program_id: 'programBelgium' },
    question_mappings: {},
};

const renderForm = () => {
    const onConfirmedQuestionMapping = vi.fn();
    renderWithThemeAndIntlProvider(
        <QuestionMappingForm
            mapping={mappingVersion}
            mappingVersion={mappingVersion}
            question={{ name: 'age', type: 'integer' }}
            indexedQuestions={{}}
            onConfirmedQuestionMapping={onConfirmedQuestionMapping}
            onUnmapQuestionMapping={vi.fn()}
            onNeverMapQuestionMapping={vi.fn()}
            fieldTypeOptions={[
                { value: 'dataElement', label: 'Program data element' },
                {
                    value: 'trackedEntityAttribute',
                    label: 'Tracked Entity Attribute',
                },
            ]}
            fieldOptions={[
                { value: VALUE_FROM_FORM, label: 'Value from the form' },
                { value: ORG_UNIT_IASO_FIELD, label: 'Org unit' },
            ]}
        />,
    );
    return onConfirmedQuestionMapping;
};

const chooseOption = (combobox: HTMLElement, option: string) => {
    fireEvent.mouseDown(combobox);
    fireEvent.click(within(screen.getByRole('listbox')).getByText(option));
};

describe('QuestionMappingForm for a tracker', () => {
    it('selects the first field type', () => {
        renderForm();
        expect(screen.getByRole('combobox')).toHaveValue(
            'Program data element',
        );
        expect(screen.queryByText(/Value not found/)).toBeNull();
        expect(
            screen.getByText(/Search for tracker data element/),
        ).toBeInTheDocument();
    });

    it('offers the tracked entity attribute search once chosen', () => {
        renderForm();
        chooseOption(screen.getByRole('combobox'), 'Tracked Entity Attribute');
        expect(screen.getByRole('combobox')).toHaveValue(
            'Tracked Entity Attribute',
        );
        expect(
            screen.getByText(/Search for tracked entity type attribute/),
        ).toBeInTheDocument();
        expect(
            screen.queryByText(/Search for tracker data element/),
        ).toBeNull();
    });

    it('fills an org unit element with the instance org unit when asked', () => {
        const onConfirmed = renderForm();
        fireEvent.click(screen.getByText('propose facility'));
        const [, iasoField] = screen.getAllByRole('combobox');
        expect(iasoField).toHaveValue('Value from the form');
        chooseOption(iasoField, 'Org unit');
        fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));
        expect(onConfirmed).toHaveBeenCalledWith([
            { ...facility, iaso_field: ORG_UNIT_IASO_FIELD },
        ]);
    });

    it('takes the answer of an org unit element by default', () => {
        const onConfirmed = renderForm();
        fireEvent.click(screen.getByText('propose facility'));
        fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));
        expect(onConfirmed).toHaveBeenCalledWith([facility]);
    });

    it('does not offer the instance property for another value type', () => {
        const onConfirmed = renderForm();
        fireEvent.click(screen.getByText('propose facility'));
        chooseOption(screen.getAllByRole('combobox')[1], 'Org unit');
        fireEvent.click(screen.getByText('propose weight'));
        expect(screen.getAllByRole('combobox')).toHaveLength(1);
        fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));
        expect(onConfirmed).toHaveBeenCalledWith([weight]);
    });
});
