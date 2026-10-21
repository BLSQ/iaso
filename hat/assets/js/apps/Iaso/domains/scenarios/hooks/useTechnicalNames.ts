import { useCallback, useState } from 'react';

const STORAGE_KEY = 'iaso.scenarios.showTechnicalNames';

const readStored = (): boolean => {
    try {
        return localStorage.getItem(STORAGE_KEY) === 'true';
    } catch {
        // storage blocked (private window...): off
        return false;
    }
};

/** The "Show technical names" switch, off by default, remembered in this browser. */
export const useTechnicalNames = (): [boolean, (show: boolean) => void] => {
    const [show, setShow] = useState<boolean>(readStored);
    const handleChange = useCallback((newShow: boolean) => {
        setShow(newShow);
        try {
            localStorage.setItem(STORAGE_KEY, String(newShow));
        } catch {
            // not remembered, still switched
        }
    }, []);
    return [show, handleChange];
};
