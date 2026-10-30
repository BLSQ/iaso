import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithThemeAndIntlProvider } from '../../../../../../tests/helpers';
import { QuestionStatus } from '../../types';
import QuestionInfos from '../QuestionInfos';
import { MappingSummary } from './MappingSummary';

// "label: value" of each LabeledValue, in display order
const fieldTexts = () =>
    screen
        .getAllByRole('group')
        .map(
            field =>
                `${field.getAttribute('aria-label')}: ${field.children[1].textContent}`,
        );

describe('MappingSummary', () => {
    it('shows a data element mapping with its combo and datasets', () => {
        renderWithThemeAndIntlProvider(
            <MappingSummary
                mapping={{
                    id: 'deBelgium',
                    name: 'Population Belgium',
                    displayName: 'Population Belgium - Female',
                    valueType: 'NUMBER',
                    domainType: 'AGGREGATE',
                    categoryOptionCombo: 'cocFemale',
                    categoryOptionComboName: 'Female',
                    dataSetElements: [
                        {
                            dataSet: {
                                id: 'dsBelgium',
                                name: 'Census Belgium',
                                periodType: 'Yearly',
                            },
                        },
                    ],
                }}
                mappingType="AGGREGATE"
            />,
        );
        expect(fieldTexts()).toEqual([
            'Data element: Population Belgium - Female',
            'Value type: NUMBER',
            'Domain type: AGGREGATE',
            'Category option combo: Female',
        ]);
        expect(screen.getByText('deBelgium')).toBeInTheDocument();
        expect(screen.getByText('cocFemale')).toBeInTheDocument();
        expect(screen.getByText('Datasets (1)')).toBeInTheDocument();
        expect(screen.getByText('Census Belgium')).toBeInTheDocument();
        expect(
            screen.getByTitle('Census Belgium - Yearly - dsBelgium'),
        ).toBeInTheDocument();
    });

    it('falls back to the ids when the names are not stored', () => {
        renderWithThemeAndIntlProvider(
            <MappingSummary
                mapping={{
                    id: 'deFrance',
                    valueType: 'NUMBER',
                    categoryOptionCombo: 'cocFrance',
                }}
                mappingType="AGGREGATE"
            />,
        );
        expect(fieldTexts()).toEqual([
            'Data element: deFrance',
            'Value type: NUMBER',
            'Domain type: --',
            'Category option combo: cocFrance',
        ]);
        // not repeated as a DHIS2 id under the value
        expect(screen.getAllByText('deFrance')).toHaveLength(1);
        expect(screen.getByText('Datasets')).toBeInTheDocument();
    });

    it('shows each item of a tracker mapping', () => {
        renderWithThemeAndIntlProvider(
            <MappingSummary
                mapping={[
                    {
                        trackedEntityAttribute: {
                            id: 'teaGender',
                            name: 'Gender',
                            valueType: 'TEXT',
                        },
                    },
                    {
                        dataElement: {
                            id: 'deFacility',
                            name: 'Facility',
                            valueType: 'ORGANISATION_UNIT',
                        },
                        iaso_field: 'instance.org_unit.source_ref',
                    },
                ]}
                mappingType="EVENT_TRACKER"
            />,
        );
        expect(fieldTexts()).toEqual([
            'Tracked Entity Attribute: Gender',
            'Value type: TEXT',
            'Program data element: Facility',
            'Value type: ORGANISATION_UNIT',
            'Use instance property to fill in this answer: Instance orgunit',
        ]);
        expect(screen.getByText('teaGender')).toBeInTheDocument();
    });

    it('shows that an org unit element takes the answer without instance property', () => {
        renderWithThemeAndIntlProvider(
            <MappingSummary
                mapping={[
                    {
                        dataElement: {
                            id: 'deFacility',
                            name: 'Facility',
                            valueType: 'ORGANISATION_UNIT',
                        },
                    },
                ]}
                mappingType="EVENT_TRACKER"
            />,
        );
        expect(fieldTexts()).toContain(
            "Use instance property to fill in this answer: Use the value from the form's answer",
        );
    });

    it('keeps the layout of a mapping when the question is not mapped', () => {
        renderWithThemeAndIntlProvider(
            <MappingSummary mappingType="AGGREGATE" emptyLabel="Not mapped" />,
        );
        expect(fieldTexts()).toEqual([
            'Data element: Not mapped',
            'Value type: --',
            'Domain type: --',
            'Category option combo: --',
        ]);
        expect(screen.getByText('Datasets')).toBeInTheDocument();
    });

    it('keeps the tracker layout when a tracker question is not mapped', () => {
        renderWithThemeAndIntlProvider(
            <MappingSummary
                mapping={{}}
                mappingType="EVENT_TRACKER"
                emptyLabel="Never mapped"
            />,
        );
        expect(fieldTexts()).toEqual([
            'Program data element: Never mapped',
            'Value type: --',
        ]);
    });

    it('shows the first datasets and the others on demand', () => {
        const dataSetElements = ['Belgium', 'France', 'Luxembourg'].map(
            name => ({ dataSet: { id: `ds${name}`, name } }),
        );
        renderWithThemeAndIntlProvider(
            <MappingSummary
                mapping={{ id: 'de', valueType: 'NUMBER', dataSetElements }}
                mappingType="AGGREGATE"
            />,
        );
        expect(screen.getByText('Datasets (3)')).toBeInTheDocument();
        expect(screen.getByText('France')).toBeInTheDocument();
        expect(screen.queryByText('Luxembourg')).toBeNull();
        fireEvent.click(screen.getByRole('button', { name: '+1' }));
        expect(screen.getByText('Luxembourg')).toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: 'Show less' }));
        expect(screen.queryByText('Luxembourg')).toBeNull();
    });

    it('shows all the datasets without a "+" chip when they fit', () => {
        const dataSetElements = ['Belgium', 'France'].map(name => ({
            dataSet: { id: `ds${name}`, name },
        }));
        renderWithThemeAndIntlProvider(
            <MappingSummary
                mapping={{ id: 'de', valueType: 'NUMBER', dataSetElements }}
                mappingType="AGGREGATE"
            />,
        );
        expect(screen.getByText('Belgium')).toBeInTheDocument();
        expect(screen.getByText('France')).toBeInTheDocument();
        expect(screen.queryByText(/^\+\d/)).toBeNull();
    });

    it('dumps a mapping it does not know', () => {
        renderWithThemeAndIntlProvider(
            <MappingSummary
                mapping={{ type: 'repeat', program_id: 'progBelgium' }}
                mappingType="EVENT_TRACKER"
            />,
        );
        expect(screen.getByText('progBelgium')).toBeInTheDocument();
    });
});

describe('QuestionInfos', () => {
    const question = {
        name: 'q_france',
        type: 'select one',
        label: 'Capitale de la France',
        bind: { required: 'yes' },
        path: ['data', 'countries', 'q_france'],
        children: [
            { name: 'paris', label: 'Paris' },
            { name: 'lyon', label: 'Lyon' },
        ],
    };

    it('shows the question details, status and options', () => {
        renderWithThemeAndIntlProvider(
            <QuestionInfos
                question={question}
                status={QuestionStatus.NEVER}
                groupLabel="Countries"
                onClose={vi.fn()}
            />,
        );
        expect(screen.getByText('Capitale de la France')).toBeInTheDocument();
        expect(screen.getByText('Never mapped')).toBeInTheDocument();
        expect(screen.getByText('Countries')).toBeInTheDocument();
        expect(fieldTexts()).toEqual([
            'Name: q_france',
            'Type: select one',
            'Bind: required: yes',
            'Path: data / countries / q_france',
        ]);
        expect(screen.getByTitle('paris')).toHaveTextContent('Paris');
        expect(screen.getByTitle('lyon')).toHaveTextContent('Lyon');
    });

    it('shows no option for a question without choices', () => {
        renderWithThemeAndIntlProvider(
            <QuestionInfos
                question={{ name: 'q_belgium', type: 'integer' }}
                status={QuestionStatus.UNMAPPED}
                onClose={vi.fn()}
            />,
        );
        expect(fieldTexts()).toEqual([
            'Name: q_belgium',
            'Type: integer',
            'Bind: --',
            'Path: --',
        ]);
        expect(screen.getByText('Options').nextSibling).toHaveTextContent('--');
    });

    it('goes back to the general information', () => {
        const onClose = vi.fn();
        renderWithThemeAndIntlProvider(
            <QuestionInfos
                question={question}
                status={QuestionStatus.MAPPED}
                onClose={onClose}
            />,
        );
        fireEvent.click(
            screen.getByRole('button', { name: /Back to general information/ }),
        );
        expect(onClose).toHaveBeenCalledTimes(1);
    });
});
