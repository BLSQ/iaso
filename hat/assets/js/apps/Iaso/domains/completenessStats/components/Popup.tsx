import React, { createRef, FunctionComponent, useCallback } from 'react';

import { Popup } from 'react-leaflet';
import { useDispatch } from 'react-redux';
import classNames from 'classnames';

import { makeStyles } from '@mui/styles';
import {
    Card,
    CardContent,
    Button,
    Grid,
    Box,
    Table,
    TableBody,
} from '@mui/material';

import { useSafeIntl, mapPopupStyles } from 'bluesquare-components';
import { LinkToOrgUnit } from '../../orgUnits/components/LinkToOrgUnit';
import { baseUrls } from '../../../constants/urls';

import MESSAGES from '../messages';
import {
    CompletenessMapStats,
    CompletenessRouterParams,
    FormStat,
} from '../types';

import { PopupRow } from './PopUpRow';

import { redirectTo } from '../../../routing/actions';

const useStyles = makeStyles(theme => ({
    ...mapPopupStyles(theme),
    popup: {
        ...mapPopupStyles(theme).popup,
        '& .leaflet-popup-content': {
            margin: 0,
            minHeight: 100,
            width: '350px !important',
        },
    },
    actionBox: {
        padding: theme.spacing(1, 0, 0, 0),
    },
    titleMessage: {
        fontSize: 16,
        marginBottom: theme.spacing(1),
    },
    linkButton: {
        color: 'inherit',
        textDecoration: 'none',
        display: 'flex',
    },
    cell: {
        border: 'none',
    },
}));

type Props = {
    location: CompletenessMapStats;
    params: CompletenessRouterParams;
    stats: FormStat;
};

const baseUrl = baseUrls.completenessStats;

export const PopupComponent: FunctionComponent<Props> = ({
    location,
    params,
    stats,
}) => {
    const { formatMessage } = useSafeIntl();
    const dispatch = useDispatch();
    const classes: Record<string, string> = useStyles();
    const popup = createRef();
    const handleClick = useCallback(
        locationId => {
            const tempParams = {
                ...params,
                parentId: `${locationId}`,
            };
            dispatch(redirectTo(baseUrl, tempParams));
        },
        [dispatch, params],
    );

    const getPercent = useCallback((): string => {
        if (params.showDirectCompleteness === 'true') {
            return stats.itself_has_instances ? '100' : '0';
        }
        return stats.percent.toFixed(2);
    }, [
        params.showDirectCompleteness,
        stats.itself_has_instances,
        stats.percent,
    ]);

    return (
        // @ts-ignore
        <Popup className={classes.popup} ref={popup} pane="popupPane">
            <Card className={classes.popupCard}>
                <CardContent className={classNames(classes.popupCardContent)}>
                    <Table size="small">
                        <TableBody>
                            <PopupRow
                                label={`${
                                    location.org_unit_type?.name ||
                                    formatMessage(MESSAGES.name)
                                }`}
                                value={<LinkToOrgUnit orgUnit={location} />}
                            />

                            <PopupRow
                                label={formatMessage(MESSAGES.completeness)}
                                value={`${getPercent()}%`}
                            />

                            <PopupRow
                                label={formatMessage(MESSAGES.count)}
                                value={
                                    stats.descendants > 0
                                        ? `${stats.descendants_ok}/${stats.descendants}`
                                        : 'N/A'
                                }
                            />
                        </TableBody>
                    </Table>
                    <Box className={classes.actionBox}>
                        <Grid
                            container
                            spacing={0}
                            justifyContent="flex-end"
                            alignItems="center"
                        >
                            {location.has_children && (
                                <Button
                                    variant="outlined"
                                    color="primary"
                                    size="small"
                                    onClick={() => handleClick(location.id)}
                                >
                                    {formatMessage(MESSAGES.seeChildren)}
                                </Button>
                            )}
                        </Grid>
                    </Box>
                </CardContent>
            </Card>
        </Popup>
    );
};
