const reactTableStyles = theme => ({
    reactTable: {
        '& .ReactTable .rt-thead .rt-th.-sort-asc,.rt-thead .rt-td.-sort-asc': {
            boxShadow: `inset 0 3px 0 0 ${theme.palette.primary.main}`,
        },
        '& .ReactTable .rt-thead .rt-th.-sort-desc,.rt-thead .rt-td.-sort-desc': {
            boxShadow: `inset 0 -3px 0 0 ${theme.palette.primary.main}`,
        },
    },
});

export default reactTableStyles;
