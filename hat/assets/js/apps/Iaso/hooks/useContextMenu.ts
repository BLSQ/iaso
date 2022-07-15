import { useEffect, useCallback, useState } from 'react';

type AnchorPoint = { x: number; y: number };

type ContextMenu = {
    showContext: boolean;
    anchorPoint: AnchorPoint;
    target: HTMLElement | undefined;
};

export const useContextMenu = (target: HTMLElement): ContextMenu => {
    const [anchorPoint, setAnchorPoint] = useState({
        x: 0,
        y: 0,
    });
    const [showContext, setShowContext] = useState(false);
    const [eventTarget, setEventTarget] = useState(undefined);

    const handleContextMenu = useCallback(
        event => {
            event.preventDefault();
            setAnchorPoint({
                x: event.pageX,
                y: event.pageY,
            });
            setEventTarget(event.target);
            setShowContext(true);
        },
        [setShowContext, setAnchorPoint],
    );

    const handleClick = useCallback(
        () => (showContext ? setShowContext(false) : null),
        [showContext],
    );

    useEffect(() => {
        if (target) {
            target.addEventListener('click', handleClick);
            target.addEventListener('contextmenu', handleContextMenu);
        }
        return () => {
            if (target) {
                target.removeEventListener('click', handleClick);
                target.removeEventListener('contextmenu', handleContextMenu);
            }
        };
    }, [handleClick, handleContextMenu, target]);
    return { anchorPoint, showContext, target: eventTarget };
};
