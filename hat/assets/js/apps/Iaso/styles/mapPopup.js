const mapPopupStyles = theme => ({
    popup: {
        margin: 0,
        '& .leaflet-popup-content-wrapper': {
            padding: 0,
        },
        '& .leaflet-popup-content': {
            margin: 0,
            minHeight: 150,
            width: 400,
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
