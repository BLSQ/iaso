import React from 'react';
import { fireEvent, render, renderHook, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useEscapeKey } from './useEscapeKey';

const pressEscape = (target: Element | Window = window) =>
    fireEvent.keyDown(target, { key: 'Escape' });

describe('useEscapeKey', () => {
    it('calls back on Escape', () => {
        const onEscape = vi.fn();
        renderHook(() => useEscapeKey(onEscape, true));
        fireEvent.keyDown(window, { key: 'Enter' });
        expect(onEscape).not.toHaveBeenCalled();
        pressEscape();
        expect(onEscape).toHaveBeenCalledTimes(1);
    });

    it('does nothing while disabled, e.g. without a selected question', () => {
        const onEscape = vi.fn();
        renderHook(() => useEscapeKey(onEscape, false));
        pressEscape();
        expect(onEscape).not.toHaveBeenCalled();
    });

    it('leaves Escape to a field or a dialog', () => {
        const onEscape = vi.fn();
        renderHook(() => useEscapeKey(onEscape, true));
        render(
            <>
                <input aria-label="search" />
                <textarea aria-label="comment" />
                <div role="dialog">
                    <button type="button">Close</button>
                </div>
            </>,
        );
        pressEscape(screen.getByRole('textbox', { name: 'search' }));
        pressEscape(screen.getByRole('textbox', { name: 'comment' }));
        pressEscape(screen.getByRole('button', { name: 'Close' }));
        expect(onEscape).not.toHaveBeenCalled();
    });

    it('stops listening once unmounted', () => {
        const onEscape = vi.fn();
        const { unmount } = renderHook(() => useEscapeKey(onEscape, true));
        unmount();
        pressEscape();
        expect(onEscape).not.toHaveBeenCalled();
    });
});
