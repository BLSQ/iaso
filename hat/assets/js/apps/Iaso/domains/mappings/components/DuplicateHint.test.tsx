import React from 'react';
import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithThemeAndIntlProvider } from '../../../../../tests/helpers';
import { DuplicateHint } from './DuplicateHint';

const belgium = { id: 'deBelgium', categoryOptionCombo: 'coc' };

const mappingVersion = {
    question_mappings: {
        q1: belgium,
        q2: belgium,
        q3: { id: 'deBelgium', categoryOptionCombo: 'otherCoc' },
        never1: { type: 'neverMapped' },
        never2: { type: 'neverMapped' },
        tracker1: [{ trackedEntityAttribute: { id: 'teaFrance' } }],
    },
};

describe('DuplicateHint', () => {
    it('lists the questions mapped to the same data element and combo', () => {
        renderWithThemeAndIntlProvider(
            <DuplicateHint mapping={belgium} mappingVersion={mappingVersion} />,
        );
        expect(screen.getByRole('alert')).toHaveTextContent('q1 , q2');
    });

    it('ignores a tracker mapping, which has no id', () => {
        renderWithThemeAndIntlProvider(
            <DuplicateHint
                mapping={[{ trackedEntityAttribute: { id: 'teaFrance' } }]}
                mappingVersion={mappingVersion}
            />,
        );
        expect(screen.queryByRole('alert')).toBeNull();
    });

    it('ignores a never mapped marker', () => {
        renderWithThemeAndIntlProvider(
            <DuplicateHint
                mapping={{ type: 'neverMapped' }}
                mappingVersion={mappingVersion}
            />,
        );
        expect(screen.queryByRole('alert')).toBeNull();
    });
});
