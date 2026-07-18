import React from 'react';
import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithThemeAndIntlProvider } from '../../../../../tests/helpers';
import { DetailsWrapper } from './DetailsWrapper';

describe('DetailsWrapper', () => {
    it('renders title, actions and children', () => {
        renderWithThemeAndIntlProvider(
            <DetailsWrapper
                title="Mission title"
                actions={<button type="button">Save</button>}
            >
                <div>Body content</div>
            </DetailsWrapper>,
        );

        expect(screen.getByText('Mission title')).toBeInTheDocument();
        expect(
            screen.getByRole('button', { name: 'Save' }),
        ).toBeInTheDocument();
        expect(screen.getByText('Body content')).toBeInTheDocument();
    });
});
