import { MENU_HEIGHT_WITHOUT_TABS } from 'bluesquare-components';
import { SxStyles } from 'Iaso/types/general';

// what a sticky column may take: the page's box, less its padding
const stickyHeight = `calc(100vh - ${MENU_HEIGHT_WITHOUT_TABS}px - 48px)`;

export const pageStyles: SxStyles = {
    // the layout doesn't scroll: a page scrolls in its own box, below the top bar
    scroll: {
        height: `calc(100vh - ${MENU_HEIGHT_WITHOUT_TABS}px)`,
        overflow: 'auto',
    },
    // wide screens use their width: the forms are real-sized
    main: {
        maxWidth: 2200,
        mx: 'auto',
        p: { xs: 2, md: 3 },
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
    },
    // the journey | the step | what the app does; below xl the last one goes under the step, below md all stack
    columns: {
        display: 'grid',
        gap: 2,
        alignItems: 'start',
        gridTemplateColumns: {
            xs: 'minmax(0, 1fr)',
            md: '260px minmax(0, 1fr)',
            xl: '280px minmax(0, 1fr) 400px',
        },
    },
    // the journey and the entity stay in view while the step scrolls
    left: {
        minWidth: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        position: { md: 'sticky' },
        top: { md: 0 },
        maxHeight: { md: stickyHeight },
        overflow: { md: 'auto' },
    },
    center: {
        minWidth: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
    },
    right: {
        minWidth: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        gridColumn: { md: '2', xl: '3' },
        position: { xl: 'sticky' },
        top: { xl: 0 },
        maxHeight: { xl: stickyHeight },
        overflow: { xl: 'auto' },
    },
};
