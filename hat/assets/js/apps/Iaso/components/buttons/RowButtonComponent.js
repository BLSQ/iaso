import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router';
import { FormattedMessage } from 'react-intl';
import {
    withStyles,
    IconButton,
    Tooltip,
} from '@material-ui/core';
import Delete from '@material-ui/icons/Delete';
import FilterList from '@material-ui/icons/FilterList';
import CallMerge from '@material-ui/icons/CallMerge';
import RemoveRedEye from '@material-ui/icons/RemoveRedEye';
import Edit from '@material-ui/icons/Edit';
import History from '@material-ui/icons/History';
import Map from '@material-ui/icons/Map';
import XmlSvg from '../svg/XmlSvgComponent';

import commonStyles from '../../styles/common';

const ICON_VARIANTS = {
    delete: Delete,
    'filter-list': FilterList,
    'call-merge': CallMerge,
    'remove-red-eye': RemoveRedEye,
    edit: Edit,
    xml: XmlSvg,
    history: History,
    map: Map,
};

const styles = theme => ({
    ...commonStyles(theme),
    popperFixed: {
        ...commonStyles(theme).popperFixed,
        marginTop: theme.spacing(1),
    },
});

function RowButtonIcon({ icon: Icon, iconProps, onClick }) {
    const allProps = { ...iconProps };
    if (onClick !== null) {
        allProps.onClick = onClick;
    }

    if (Icon === undefined) {
        return 'wrong icon';
    }

    return <Icon {...allProps} />;
}
RowButtonIcon.defaultProps = {
    onClick: null,
};
RowButtonIcon.propTypes = {
    onClick: PropTypes.func,
    icon: PropTypes.object.isRequired,
    iconProps: PropTypes.objectOf(PropTypes.any).isRequired,
};

function RowButtonComponent({
    classes, disabled, onClick, url, icon: iconName, iconProps, tooltipMessage,
}) {
    if ((onClick === null) === (url === null)) {
        console.error('RowButtonComponent needs either the onClick or the url property');
    }
    const icon = ICON_VARIANTS[iconName];

    return (
        <Tooltip
            classes={{ popper: classes.popperFixed }}
            disableFocusListener={disabled}
            disableHoverListener={disabled}
            disableTouchListener={disabled}
            placement="bottom"
            title={<FormattedMessage {...tooltipMessage} />}
        >
            <span>
                <IconButton disabled={disabled} onClick={onClick}>
                    {
                        url ? (
                            <Link to={url} className={classes.linkButton}>
                                <RowButtonIcon icon={icon} iconProps={iconProps} />
                            </Link>
                        )
                            : <RowButtonIcon icon={icon} iconProps={iconProps} />
                    }
                </IconButton>
            </span>
        </Tooltip>
    );
}
RowButtonComponent.defaultProps = {
    disabled: false,
    url: null,
    onClick: null,
    iconProps: {},
};
RowButtonComponent.propTypes = {
    classes: PropTypes.object.isRequired,
    onClick: PropTypes.func,
    url: PropTypes.string,
    disabled: PropTypes.bool,
    icon: PropTypes.oneOf(Object.keys(ICON_VARIANTS)).isRequired,
    iconProps: PropTypes.objectOf(PropTypes.any),
    tooltipMessage: PropTypes.object.isRequired, // TODO: make a message prop type
};
export default withStyles(styles)(RowButtonComponent);
