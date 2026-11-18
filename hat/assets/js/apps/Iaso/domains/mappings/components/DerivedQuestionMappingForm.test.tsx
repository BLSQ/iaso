import React from 'react';
import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithThemeAndIntlProvider } from '../../../../../tests/helpers';
import DerivedQuestionMappingForm from './DerivedQuestionMappingForm';

const question = { name: 'belgium_total' };

describe('DerivedQuestionMappingForm', () => {
    it('shows only the aggregation of the selected question', () => {
        renderWithThemeAndIntlProvider(
            <DerivedQuestionMappingForm
                question={question}
                mappingVersion={{
                    derivate_settings: {
                        aggregations: [
                            { id: 'belgium_total', aggregationType: 'SUM' },
                            { id: 'france_total', aggregationType: 'COUNT' },
                        ],
                    },
                }}
            />,
        );

        expect(screen.getByText('SUM')).toBeInTheDocument();
        expect(screen.queryByText('COUNT')).not.toBeInTheDocument();
    });

    it.each([
        ['no derivate settings', {}],
        ['null derivate settings', { derivate_settings: null }],
        ['no aggregations', { derivate_settings: {} }],
    ])('renders an empty card with %s', (_, mappingVersion) => {
        renderWithThemeAndIntlProvider(
            <DerivedQuestionMappingForm
                question={question}
                mappingVersion={mappingVersion}
            />,
        );

        expect(screen.getByText('Aggregation')).toBeInTheDocument();
        expect(screen.queryByText(/id :/)).not.toBeInTheDocument();
    });
});
