import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AvatarTimeline } from './AvatarTimeline';

describe('AvatarTimeline', () => {
    it('renders MoreHoriz icon when type is NEXT_BYPASS', () => {
        render(<AvatarTimeline type="NEXT_BYPASS" status="ACCEPTED" />);

        expect(screen.getByTestId('MoreHorizIcon')).toBeInTheDocument();
    });

    it('renders Clear icon when status is REJECTED', () => {
        render(<AvatarTimeline type="TIMELINE" status="REJECTED" />);

        expect(screen.getByTestId('ClearIcon')).toBeInTheDocument();
    });

    it('renders Check icon when status is ACCEPTED', () => {
        render(<AvatarTimeline type="TIMELINE" status="ACCEPTED" />);

        expect(screen.getByTestId('CheckIcon')).toBeInTheDocument();
    });

    it('renders SkipNext icon when status is SKIPPED', () => {
        render(<AvatarTimeline type="TIMELINE" status="SKIPPED" />);

        expect(screen.getByTestId('SkipNextIcon')).toBeInTheDocument();
    });

    it('renders MoreHoriz icon when status is UNKNOWN', () => {
        render(<AvatarTimeline type="TIMELINE" status="UNKNOWN" />);

        expect(screen.getByTestId('MoreHorizIcon')).toBeInTheDocument();
    });

    it('renders nothing for unsupported status', () => {
        const { container } = render(
            <AvatarTimeline
                type="TIMELINE"
                status={'UNSUPPORTED_STATUS' as never}
            />,
        );

        expect(container.innerHTML).toBe('');
    });
});
