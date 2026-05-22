import React from 'react';
import { render } from '@testing-library/react';
import { axe } from 'jest-axe';
import { describe, expect, it } from 'vitest';

import { AvatarTimeline } from './AvatarTimeline';

describe('AvatarTimeline accessibility', () => {
    it('should have no accessibility violations for REJECTED state', async () => {
        const { container } = render(
            <AvatarTimeline type="TIMELINE" status="REJECTED" />,
        );

        const results = await axe(container);

        expect(results).toHaveNoViolations();
    });

    it('should have no accessibility violations for ACCEPTED state', async () => {
        const { container } = render(
            <AvatarTimeline type="TIMELINE" status="ACCEPTED" />,
        );

        const results = await axe(container);

        expect(results).toHaveNoViolations();
    });

    it('should have no accessibility violations for SKIPPED state', async () => {
        const { container } = render(
            <AvatarTimeline type="TIMELINE" status="SKIPPED" />,
        );

        const results = await axe(container);

        expect(results).toHaveNoViolations();
    });

    it('should have no accessibility violations for UNKNOWN state', async () => {
        const { container } = render(
            <AvatarTimeline type="TIMELINE" status="UNKNOWN" />,
        );

        const results = await axe(container);

        expect(results).toHaveNoViolations();
    });

    it('should have no accessibility violations for NEXT_BYPASS type', async () => {
        const { container } = render(
            <AvatarTimeline type="NEXT_BYPASS" status="ACCEPTED" />,
        );

        const results = await axe(container);

        expect(results).toHaveNoViolations();
    });
});
