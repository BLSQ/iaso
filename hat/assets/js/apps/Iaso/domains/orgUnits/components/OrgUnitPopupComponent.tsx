import React, { createRef, FunctionComponent } from 'react';
import {
    Box,
    Card,
    CardContent,
    Divider,
    Grid,
    Typography,
    CardMedia,
} from '@mui/material';
import { makeStyles } from '@mui/styles';
import {
    LoadingSpinner,
    commonStyles,
    mapPopupStyles,
    textPlaceholder,
    useSafeIntl,
    LinkWithLocation,
} from 'bluesquare-components';
import classNames from 'classnames';
import moment from 'moment';
import { Popup } from 'react-leaflet';
import ConfirmDialog from '../../../components/dialogs/ConfirmDialogComponent';
import PopupItemComponent from '../../../components/maps/popups/PopupItemComponent';
import { usePopupState } from '../../../utils/map/usePopupState';
import { useGetOrgUnitDetail } from '../hooks/requests/useGetOrgUnitDetail';
import MESSAGES from '../messages';
import { LinkToOrgUnit } from './LinkToOrgUnit';
import { baseUrls } from '../../../constants/urls';
import { OrgUnit } from '../types/orgUnit';

//@ts-ignore
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

type Props = {
    displayUseLocation?: boolean;
    replaceLocation?: (orgUnit?: OrgUnit) => void;
    titleMessage?: string;
    orgUnitId: number;
};

const OrgUnitPopupComponent: FunctionComponent<Props> = ({
    displayUseLocation = false,
    replaceLocation = () => {},
    titleMessage,
    orgUnitId,
}) => {
    const { formatMessage } = useSafeIntl();
    const classes: Record<string, string> = useStyles();
    const popup = createRef();
    const isOpen = usePopupState(popup);
    const { data: currentOrgUnit } = useGetOrgUnitDetail(
        isOpen ? orgUnitId : undefined,
    );

    const confirmDialog = () => {
        replaceLocation(currentOrgUnit);
    };

    return (
        <Popup className={classes.popup} ref={popup} pane="popupPane">
            {!currentOrgUnit && <LoadingSpinner />}
            {currentOrgUnit && (
                <Card className={classes.popupCard}>
                    {currentOrgUnit.default_image && (
                        <CardMedia
                            href={currentOrgUnit.default_image.file}
                            className={classes.popupCardMedia}
                            image={currentOrgUnit.default_image.file}
                            component="div"
                        />
                    )}
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
                            value={<LinkToOrgUnit orgUnit={currentOrgUnit} />}
                        />
                        <PopupItemComponent
                            label={formatMessage(MESSAGES.type)}
                            value={currentOrgUnit.org_unit_type_name}
                        />
                        <PopupItemComponent
                            label={formatMessage(MESSAGES.parent)}
                            value={
                                currentOrgUnit.parent ? (
                                    <LinkToOrgUnit
                                        orgUnit={currentOrgUnit.parent}
                                    />
                                ) : (
                                    textPlaceholder
                                )
                            }
                        />
                        <PopupItemComponent
                            label={formatMessage(MESSAGES.created_at)}
                            value={moment
                                .unix(currentOrgUnit.created_at)
                                .format('LTS')}
                        />
                        <PopupItemComponent
                            label={formatMessage(MESSAGES.instances)}
                            value={
                                <LinkWithLocation
                                    className={classes.link}
                                    to={`/${baseUrls.instances}/levels/${currentOrgUnit.id}`}
                                >
                                    {`${
                                        currentOrgUnit.instances_count
                                    } ${formatMessage(MESSAGES.orgUnitInstances)}`}
                                </LinkWithLocation>
                            }
                        />
                        <PopupItemComponent
                            label={formatMessage(MESSAGES.source)}
                            value={currentOrgUnit.source}
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
                            </Grid>
                        </Box>
                    </CardContent>
                </Card>
            )}
        </Popup>
    );
};

export default OrgUnitPopupComponent;
