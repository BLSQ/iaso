import { useEffect } from 'react';

/**
 * Calls onEscape when Escape is pressed on the page, except in a field or a
 * dialog, where Escape already clears the input or closes the dialog.
 */
export const useEscapeKey = (onEscape: () => void, enabled: boolean): void => {
    useEffect(() => {
        if (!enabled) {
            return undefined;
        }
        const handleKeyDown = (event: KeyboardEvent) => {
            const target = event.target as HTMLElement;
            if (
                event.key !== 'Escape' ||
                target.closest?.('input, textarea, [role="dialog"]')
            ) {
                return;
            }
            onEscape();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onEscape, enabled]);
};
