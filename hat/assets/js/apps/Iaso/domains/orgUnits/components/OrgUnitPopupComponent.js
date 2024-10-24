import {
    Box,
    Card,
    CardContent,
    Divider,
    Grid,
    Typography,
} from '@mui/material';
import { makeStyles } from '@mui/styles';
import {
    LinkButton,
    LoadingSpinner,
    commonStyles,
    mapPopupStyles,
    textPlaceholder,
    useSafeIntl,
} from 'bluesquare-components';
import classNames from 'classnames';
import moment from 'moment';
import PropTypes from 'prop-types';
import React, { createRef } from 'react';
import { Popup } from 'react-leaflet';
import ConfirmDialog from '../../../components/dialogs/ConfirmDialogComponent';
import PopupItemComponent from '../../../components/maps/popups/PopupItemComponent';
import { baseUrls } from '../../../constants/urls.ts';
import { usePopupState } from '../../../utils/map/usePopupState';
import { useGetOrgUnitDetail } from '../hooks/requests/useGetOrgUnitDetail';
import MESSAGES from '../messages.ts';

const useStyles = makeStyles(theme => ({
    ...commonStyles(theme),
    ...mapPopupStyles(theme),
    fileList: {
        listStyleType: 'none',
    },
    fileListItem: {
        padding: theme.spacing(1, 1, 1, 0),
        display: 'inline-block',
    },
    fileItem: {
        display: 'inline-block',
    },
    actionBox: {
        padding: theme.spacing(1, 0, 0, 0),
    },
    titleMessage: {
        fontSize: 16,
        marginBottom: theme.spacing(1),
    },
    popupCardContentWithTitle: {
        marginTop: theme.spacing(1),
    },
    linkButton: {
        color: 'inherit',
        textDecoration: 'none',
        display: 'flex',
        '&:hover': { textDecoration: 'none' },
    },
}));

const OrgUnitPopupComponent = ({
    displayUseLocation,
    replaceLocation,
    titleMessage,
    orgUnitId,
}) => {
    const { formatMessage } = useSafeIntl();
    const classes = useStyles();
    const popup = createRef();
    const isOpen = usePopupState(popup);
    const { data: currentOrgUnit } = useGetOrgUnitDetail(
        isOpen ? orgUnitId : undefined,
    );
    const confirmDialog = () => {
        replaceLocation(currentOrgUnit);
    };
    let groups = null;
    if (currentOrgUnit && currentOrgUnit.groups.length > 0) {
        groups = currentOrgUnit.groups.map(g => g.name).join(', ');
    }
    return (
        <Popup className={classes.popup} ref={popup} pane="popupPane">
            {!currentOrgUnit && <LoadingSpinner />}
            {currentOrgUnit && (
                <Card className={classes.popupCard}>
                    <CardContent
                        className={classNames(
                            classes.popupCardContent,
                            titleMessage && classes.popupCardContentWithTitle,
                        )}
                    >
                        {titleMessage && (
                            <Box mb={2}>
                                <Typography
                                    variant="h6"
                                    className={classes.titleMessage}
                                >
                                    {titleMessage}
                                </Typography>
                                <Divider />
                            </Box>
                        )}
                        <PopupItemComponent
                            label={formatMessage(MESSAGES.name)}
                            value={currentOrgUnit.name}
                        />
                        <PopupItemComponent
                            label={formatMessage(MESSAGES.type)}
                            value={currentOrgUnit.org_unit_type_name}
                        />
                        <PopupItemComponent
                            label={formatMessage(MESSAGES.groups)}
                            value={groups}
                        />
                        <PopupItemComponent
                            label={formatMessage(MESSAGES.source)}
                            value={currentOrgUnit.source}
                        />
                        <PopupItemComponent
                            label={formatMessage(MESSAGES.parent)}
                            value={
                                currentOrgUnit.parent
                                    ? currentOrgUnit.parent.name
                                    : textPlaceholder
                            }
                        />
                        {!currentOrgUnit.has_geo_json && (
                            <>
                                <PopupItemComponent
                                    label={formatMessage(MESSAGES.latitude)}
                                    value={currentOrgUnit.latitude}
                                />
                                <PopupItemComponent
                                    label={formatMessage(MESSAGES.longitude)}
                                    value={currentOrgUnit.longitude}
                                />
                            </>
                        )}
                        <PopupItemComponent
                            label={formatMessage(MESSAGES.created_at)}
                            value={moment
                                .unix(currentOrgUnit.created_at)
                                .format('LTS')}
                        />
                        <Box className={classes.actionBox}>
                            <Grid
                                container
                                spacing={0}
                                justifyContent={
                                    displayUseLocation ? 'center' : 'flex-end'
                                }
                                alignItems="center"
                            >
                                {displayUseLocation && (
                                    <ConfirmDialog
                                        btnSize="small"
                                        btnMessage={formatMessage(
                                            MESSAGES.associate,
                                        )}
                                        question={formatMessage(
                                            MESSAGES.question,
                                        )}
                                        message={formatMessage(
                                            MESSAGES.message,
                                        )}
                                        confirm={() => confirmDialog()}
                                    />
                                )}
                                <LinkButton
                                    target="_blank"
                                    to={`/${baseUrls.orgUnitDetails}/orgUnitId/${currentOrgUnit.id}/tab/infos`}
                                    className={classes.linkButton}
                                    buttonClassName={classes.marginLeft}
                                    variant="outlined"
                                    color="primary"
                                    size="small"
                                >
                                    {formatMessage(MESSAGES.see)}
                                </LinkButton>
                            </Grid>
                        </Box>
                    </CardContent>
                </Card>
            )}
        </Popup>
    );
};

OrgUnitPopupComponent.defaultProps = {
    displayUseLocation: false,
    replaceLocation: () => {},
    titleMessage: null,
};

OrgUnitPopupComponent.propTypes = {
    displayUseLocation: PropTypes.bool,
    replaceLocation: PropTypes.func,
    titleMessage: PropTypes.oneOfType([PropTypes.object, PropTypes.string]),
    orgUnitId: PropTypes.number.isRequired,
};

export default OrgUnitPopupComponent;
