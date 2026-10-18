import React from 'react';
import { fireEvent, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithThemeAndIntlProvider } from '../../../../../tests/helpers';
import { ORG_UNIT_IASO_FIELD, VALUE_FROM_FORM } from '../utils';
import QuestionMappingForm from './QuestionMappingForm';

// no DHIS2 call: only shows which search is offered
vi.mock('./Dhis2SearchComponent', () => ({
    default: ({ label }: { label: string }) => <div>{label}</div>,
}));

const mappingVersion = {
    mapping: { mapping_type: 'EVENT_TRACKER', data_source: { id: 1 } },
    derivate_settings: { program_id: 'programBelgium' },
    question_mappings: {},
};

const renderForm = () =>
    renderWithThemeAndIntlProvider(
        <QuestionMappingForm
            mapping={mappingVersion}
            mappingVersion={mappingVersion}
            question={{ name: 'age', type: 'integer' }}
            indexedQuestions={{}}
            onConfirmedQuestionMapping={vi.fn()}
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

describe('QuestionMappingForm for a tracker', () => {
    it('selects the first field type and iaso field', () => {
        renderForm();
        const [fieldType, iasoField] = screen.getAllByRole('combobox');
        expect(fieldType).toHaveValue('Program data element');
        expect(iasoField).toHaveValue('Value from the form');
        expect(screen.queryByText(/Value not found/)).toBeNull();
        expect(
            screen.getByText(/Search for tracker data element/),
        ).toBeInTheDocument();
    });

    it('offers the tracked entity attribute search once chosen', () => {
        renderForm();
        fireEvent.mouseDown(screen.getAllByRole('combobox')[0]);
        fireEvent.click(
            within(screen.getByRole('listbox')).getByText(
                'Tracked Entity Attribute',
            ),
        );
        expect(screen.getAllByRole('combobox')[0]).toHaveValue(
            'Tracked Entity Attribute',
        );
        expect(
            screen.getByText(/Search for tracked entity type attribute/),
        ).toBeInTheDocument();
        expect(
            screen.queryByText(/Search for tracker data element/),
        ).toBeNull();
    });
});
