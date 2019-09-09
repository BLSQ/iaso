import React, { Fragment } from 'react';
import { injectIntl, FormattedMessage } from 'react-intl';

import {
    Marker, Popup,
} from 'react-leaflet';

import {
    withStyles,
    Grid,
    Card,
    CardMedia,
    CardContent,
} from '@material-ui/core';

import AttachFile from '@material-ui/icons/AttachFile';

import PropTypes from 'prop-types';
import moment from 'moment';

import { isValidCoordinate } from '../../utils/mapUtils';

import commonStyles from '../../styles/common';

const styles = theme => ({
    ...commonStyles(theme),
    popup: {
        margin: 0,
        '& .leaflet-popup-content': {
            margin: 0,
        },
        '& .leaflet-popup-close-button': {
            color: 'white !important',
        },
    },
    popupNoHero: {
        margin: 0,
        '& .leaflet-popup-content': {
            margin: 0,
        },
    },
    listItemLabel: {
        textAlign: 'right',
        fontWeight: 'bold',
        display: 'inline-block',
        paddingRight: theme.spacing(1) / 2,
    },
    listItem: {
        textAlign: 'left',
    },
    card: {
        height: '100%',
        width: '100%',
        borderRadius: 12,
        overflow: 'hidden',
        boxShadow: 'none',
    },
    cardMedia: {
        height: 120,
    },
    cardContent: {
        margin: theme.spacing(2),
        overflow: 'hidden',
        wordBreak: 'break-all',
        padding: '0 !important',
    },
    fileList: {
        listStyleType: 'none',
    },
    fileListItem: {
        padding: theme.spacing(1, 1),
        display: 'inline-block',
    },
    fileItem: {
        display: 'inline-block',
    },
});


function InstancesMarkersComponent(props) {
    const {
        classes,
        instances,
    } = props;


    return instances.map((i) => {
        if (!i.latitude || !i.longitude || !isValidCoordinate(i.latitude, i.longitude)) return null;
        const hasHero = i.files && i.files.length > 0;
        return (
            <Marker position={[i.latitude, i.longitude]} key={i.id}>
                <Popup className={hasHero ? classes.popup : classes.popupNoHero}>
                    <Card className={classes.card}>
                        {
                            hasHero
                            && (
                                <CardMedia
                                    className={classes.cardMedia}
                                    image={i.files[0]}
                                    href={i.files[0]}
                                />
                            )
                        }
                        <CardContent className={classes.cardContent}>
                            <Grid container spacing={0}>
                                <Grid item xs={4} className={classes.listItemLabel}>
                                    <FormattedMessage id="iaso.label.name" defaultMessage="Name" />
                                    :
                                </Grid>
                                <Grid item xs={8} className={classes.listItem}>
                                    {i.org_unit.name}
                                </Grid>
                            </Grid>
                            <Grid container spacing={0}>
                                <Grid item xs={4} className={classes.listItemLabel}>
                                    <FormattedMessage id="iaso.label.type" defaultMessage="Type" />
                                    :
                                </Grid>
                                <Grid item xs={8} className={classes.listItem}>
                                    {i.org_unit.org_unit_type_name}
                                </Grid>
                            </Grid>
                            <Grid container spacing={0}>
                                <Grid item xs={4} className={classes.listItemLabel}>
                                    <FormattedMessage id="iaso.instance.device" defaultMessage="IMEI device" />
                                    :
                                </Grid>
                                <Grid item xs={8} className={classes.listItem}>
                                    {i.device_id ? i.device_id : '/'}
                                </Grid>
                            </Grid>
                            <Grid container spacing={1}>
                                <Grid item xs={4} className={classes.listItemLabel}>
                                    <FormattedMessage id="iaso.instance.coordinate" defaultMessage="Coordinates" />
                                    :
                                </Grid>
                                <Grid item xs={8} className={classes.listItem}>
                                    {' '}
                                    Long:
                                    {' '}
                                    {i.longitude}
                                    {' '}
                                    <br />
                                    {' '}
                                    Lat:
                                    {' '}
                                    {i.latitude}
                                </Grid>
                            </Grid>
                            <Grid container spacing={0}>
                                <Grid item xs={4} className={classes.listItemLabel}>
                                    <FormattedMessage id="iaso.instance.created_at" defaultMessage="Created at" />
                                    :
                                </Grid>
                                <Grid item xs={8} className={classes.listItem}>
                                    {moment.unix(i.created_at).format('DD/MM/YYYY HH:mm')}
                                </Grid>
                            </Grid>
                            <Grid container spacing={0}>
                                <Grid item xs={4} className={classes.listItemLabel}>
                                    <FormattedMessage id="iaso.instance.files" defaultMessage="Files" />
                                    :
                                </Grid>
                                <Grid item xs={8} className={classes.listItem}>
                                    <ul className={classes.fileList}>
                                        <li>
                                            <a className={classes.fileItem} target="_blank" rel="noopener noreferrer" href={i.file_url}>{i.file_name}</a>
                                        </li>
                                        {i.files.map(f => (
                                            <li className={classes.fileListItem} key={f}>
                                                <a className={classes.fileItem} target="_blank" rel="noopener noreferrer" href={f}>{<AttachFile />}</a>
                                            </li>
                                        ))}
                                    </ul>
                                </Grid>
                            </Grid>
                        </CardContent>
                    </Card>
                </Popup>
            </Marker>
        );
    });
}
InstancesMarkersComponent.defaultProps = {
    instances: [],
};

InstancesMarkersComponent.propTypes = {
    intl: PropTypes.object.isRequired,
    instances: PropTypes.array,
    classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(injectIntl(InstancesMarkersComponent));
