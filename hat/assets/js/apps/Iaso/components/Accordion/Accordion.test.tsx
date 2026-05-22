import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Accordion } from './Accordion';

describe('Accordion', () => {
    it('renders children', () => {
        render(
            <Accordion>
                <div>Content</div>
            </Accordion>,
        );

        expect(screen.getByText('Content')).toBeInTheDocument();
    });
});