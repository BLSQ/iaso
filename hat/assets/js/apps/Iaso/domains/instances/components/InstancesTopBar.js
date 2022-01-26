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
import { INSTANCE_METAS_FIELDS } from '../constants';

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
    instances,
}) => {
    const classes = useStyles();
    const dispatch = useDispatch();
    const currentUser = useSelector(state => state.users.current);
    const [visibleColumns, setVisibleColumns] = useState([]);
    const { formatMessage } = useSafeIntl();

    const formIds = params.formIds?.split(',');

    const handleChangeVisibleColmuns = cols => {
        const newParams = {
            ...params,
            columns: cols
                .filter(c => c.active)
                .map(c => c.key)
                .join(','),
        };
        setTableColumns(
            getInstancesColumns(
                formatMessage,
                cols,
                params.showDeleted === 'true',
                currentUser,
            ),
        );
        setVisibleColumns(cols);
        dispatch(redirectToReplace(baseUrl, newParams));
    };

    useEffect(() => {
        if (instances || tableColumns.length === 0) {
            const enrichedParams = { ...params };
            let columns = INSTANCE_METAS_FIELDS.filter(f =>
                Boolean(f.tableOrder),
            ).map(f => f.accessor || f.key);
            if (formIds && formIds.length === 1) {
                columns = columns.filter(c => c !== 'form__name');
                if (periodType === null) {
                    columns = columns.filter(c => c !== 'period');
                }
            }

            columns = columns.join(',');
            const columnsWithLabelKeys = `${columns},${labelKeys.join(',')}`;
            enrichedParams.columns = columnsWithLabelKeys;
            const cols = getInstancesVisibleColumns({
                formatMessage,
                instance: instances && instances[0],
                columns: enrichedParams.columns,
                order: enrichedParams.order,
                defaultOrder,
                possibleFields,
            });
            handleChangeVisibleColmuns(cols);
        }
    }, [instances, possibleFields]);

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
    instances: undefined,
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
    instances: PropTypes.array,
};

export { InstancesTopBar };
