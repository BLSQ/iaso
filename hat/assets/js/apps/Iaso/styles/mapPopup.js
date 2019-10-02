const mapPopupStyles = theme => ({
    popup: {
        margin: 0,
        bottom: '10px !important',
        '& .leaflet-popup-content-wrapper': {
            padding: 0,
        },
        '& .leaflet-popup-content': {
            margin: 0,
            minHeight: 100,
            width: '320px !important',
        },
        '& a.leaflet-popup-close-button': {
            color: 'white',
            backgroundColor: theme.palette.primary.main,
            padding: '1px 0 0 0',
            top: '8px',
            right: '8px',
            borderRadius: '20px',
            height: '18px',
        },
        '& a.leaflet-popup-close-button:hover': {
            color: theme.palette.primary.main,
            backgroundColor: 'white',
            border: `1px solid ${theme.palette.primary.main}`,
        },
    },
    popupListItemLabel: {
        textAlign: 'right',
        fontWeight: 'bold',
        display: 'inline-block',
        paddingRight: theme.spacing(1) / 2,
    },
    popuplistItem: {
        textAlign: 'left',
    },
    popupCard: {
        height: '100%',
        width: '100%',
        borderRadius: 12,
        overflow: 'hidden',
        boxShadow: 'none',
    },
    popupCardMedia: {
        height: 120,
    },
    popupCardContent: {
        margin: theme.spacing(2),
        overflow: 'hidden',
        wordBreak: 'break-all',
        padding: '0 !important',
    },
});

export default mapPopupStyles;
