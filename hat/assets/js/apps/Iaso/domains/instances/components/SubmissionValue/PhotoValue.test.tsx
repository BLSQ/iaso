import React from 'react';
import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithThemeAndIntlProvider } from '../../../../../../tests/helpers';
import { PhotoValue } from './PhotoValue';
import { makeField } from './testUtils';

describe('PhotoValue', () => {
    it('renders the empty placeholder when no matching file exists', () => {
        renderWithThemeAndIntlProvider(
            <PhotoValue
                field={makeField({
                    kind: 'photo',
                    id: 'photo',
                    rawValue: 'missing.jpg',
                    empty: true,
                })}
                files={[]}
            />,
        );
        expect(screen.getByText('--')).toBeInTheDocument();
    });

    it('renders the image when a matching file is found', () => {
        renderWithThemeAndIntlProvider(
            <PhotoValue
                field={makeField({
                    kind: 'photo',
                    id: 'facility_photo',
                    rawValue: 'facility.jpg',
                    empty: false,
                })}
                files={['/media/uploads/facility.jpg']}
            />,
        );
        expect(
            screen.getByRole('img', { name: 'facility_photo' }),
        ).toHaveAttribute('src', '/media/uploads/facility.jpg');
    });

    it('matches jpg values to webp uploads', () => {
        renderWithThemeAndIntlProvider(
            <PhotoValue
                field={makeField({
                    kind: 'photo',
                    id: 'facility_photo',
                    rawValue: 'facility.jpg',
                    empty: false,
                })}
                files={['/media/uploads/facility.webp']}
            />,
        );
        expect(
            screen.getByRole('img', { name: 'facility_photo' }),
        ).toHaveAttribute('src', '/media/uploads/facility.webp');
    });
});
