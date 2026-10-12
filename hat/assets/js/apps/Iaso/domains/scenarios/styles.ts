import { MENU_HEIGHT_WITHOUT_TABS } from 'bluesquare-components';
import { SxStyles } from 'Iaso/types/general';

export const pageStyles: SxStyles = {
    // the layout doesn't scroll: a page scrolls in its own box, below the top bar
    scroll: {
        height: `calc(100vh - ${MENU_HEIGHT_WITHOUT_TABS}px)`,
        overflow: 'auto',
    },
};
