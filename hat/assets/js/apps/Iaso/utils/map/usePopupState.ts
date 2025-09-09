import L from 'leaflet';
import { RefObject, useEffect, useState } from 'react';
import { useMap } from 'react-leaflet';

export const usePopupState = (popupRef: RefObject<L.Popup>): boolean => {
    const [isOpen, setIsOpen] = useState(false);
    const map = useMap();

    useEffect(() => {
        if (!map || !popupRef.current) return;

        const onPopupOpen = (e: L.PopupEvent): void => {
            if (e.popup === popupRef.current) {
                setIsOpen(true);
            }
        };

        const onPopupClose = (e: L.PopupEvent): void => {
            if (e.popup === popupRef.current) {
                setIsOpen(false);
            }
        };

        map.on('popupopen', onPopupOpen);
        map.on('popupclose', onPopupClose);

        () => {
            map.off('popupopen', onPopupOpen);
            map.off('popupclose', onPopupClose);
        };
    }, [map, popupRef]);

    return isOpen;
};
