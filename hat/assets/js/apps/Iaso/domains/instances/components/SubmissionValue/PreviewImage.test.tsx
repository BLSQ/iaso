import React from 'react';
import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithThemeAndIntlProvider } from '../../../../../../tests/helpers';
import { PreviewImage } from './PreviewImage';

describe('PreviewImage', () => {
    it('renders an image with the given url and alt text', () => {
        renderWithThemeAndIntlProvider(
            <PreviewImage url="/media/photo.jpg" alt="facility_photo" />,
        );
        const image = screen.getByRole('img', { name: 'facility_photo' });
        expect(image).toBeInTheDocument();
        expect(image).toHaveAttribute('src', '/media/photo.jpg');
    });
});
