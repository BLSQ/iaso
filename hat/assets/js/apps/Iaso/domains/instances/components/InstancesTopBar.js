import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';

import { makeStyles, Grid, Tabs, Tab } from '@material-ui/core';
import { commonStyles, useSafeIntl } from 'bluesquare-components';
import TopBar from '../../../components/nav/TopBarComponent';

import { redirectToReplace } from '../../../routing/actions';
import { getInstancesColumns, getInstancesVisibleColumns } from '../utils';

import { ColumnsSelectDrawer } from '../../../components/tables/ColumnSelectDrawer';
import MESSAGES from '../messages';

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
    selectColmunsContainer: {
        paddingRight: theme.spacing(4),
        position: 'relative',
        top: -theme.spacing(2),
    },
}));

const defaultOrder = 'updated_at';

const InstancesTopBar = ({
    formName,
    tab,
    handleChangeTab,
    params,
    periodType,
    setTableColumns,
    tableColumns,
    baseUrl,
    labelKeys,
    possibleFields,
}) => {
    const classes = useStyles();
    const dispatch = useDispatch();
    const [visibleColumns, setVisibleColumns] = useState([]);
    const { formatMessage } = useSafeIntl();
    const reduxPage = useSelector(state => state.instances.instancesPage);

    const formIds = params.formIds?.split(',');

    const handleChangeVisibleColmuns = cols => {
        const tempVisibleColumns =
            periodType === null
                ? cols.filter(column => column.key !== 'period')
                : cols;

        const newParams = {
            ...params,
            columns: tempVisibleColumns
                .filter(c => c.active)
                .map(c => c.key)
                .join(','),
        };
        setTableColumns(
            getInstancesColumns(
                formatMessage,
                tempVisibleColumns,
                params.showDeleted === 'true',
            ),
        );
        setVisibleColumns(tempVisibleColumns);
        dispatch(redirectToReplace(baseUrl, newParams));
    };

    useEffect(() => {
        if (reduxPage?.list || tableColumns.length === 0) {
            const enrichedParams = { ...params };
            const columnsWithLabelKeys = `${params.columns},${labelKeys.join(
                ',',
            )}`;
            enrichedParams.columns = columnsWithLabelKeys;
            const cols = getInstancesVisibleColumns({
                formatMessage,
                instance: reduxPage && reduxPage.list && reduxPage.list[0],
                columns: enrichedParams.columns,
                order: enrichedParams.order,
                defaultOrder,
                possibleFields,
            });
            handleChangeVisibleColmuns(cols);
        }
    }, [reduxPage]);

    let title = formatMessage(MESSAGES.titleMulti);
    if (formIds?.length === 1) {
        title = `${formatMessage(MESSAGES.title)}: ${formName}`;
    }
    return (
        <TopBar title={title}>
            <Grid container spacing={0}>
                <Grid xs={10} item>
                    <Tabs
                        value={tab}
                        classes={{
                            root: classes.tabs,
                            indicator: classes.indicator,
                        }}
                        onChange={(event, newtab) => handleChangeTab(newtab)}
                    >
                        <Tab
                            value="list"
                            label={formatMessage(MESSAGES.list)}
                        />
                        <Tab value="map" label={formatMessage(MESSAGES.map)} />
                        <Tab
                            value="files"
                            label={formatMessage(MESSAGES.files)}
                        />
                    </Tabs>
                </Grid>
                <Grid
                    xs={2}
                    item
                    container
                    alignItems="center"
                    justifyContent="flex-end"
                    className={classes.selectColmunsContainer}
                >
                    <ColumnsSelectDrawer
                        options={visibleColumns}
                        setOptions={cols => handleChangeVisibleColmuns(cols)}
                    />
                </Grid>
            </Grid>
        </TopBar>
    );
};

InstancesTopBar.defaultProps = {
    periodType: null,
    possibleFields: null,
    tableColumns: [],
    labelKeys: [],
};

InstancesTopBar.propTypes = {
    formName: PropTypes.string.isRequired,
    tab: PropTypes.string.isRequired,
    handleChangeTab: PropTypes.func.isRequired,
    tableColumns: PropTypes.array,
    params: PropTypes.object.isRequired,
    setTableColumns: PropTypes.func.isRequired,
    periodType: PropTypes.any,
    baseUrl: PropTypes.string.isRequired,
    possibleFields: PropTypes.any,
    labelKeys: PropTypes.array,
};

export { InstancesTopBar };
