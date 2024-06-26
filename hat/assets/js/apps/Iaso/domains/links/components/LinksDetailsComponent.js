import CheckBox from '@mui/icons-material/CheckBox';
import CheckBoxOutlineBlank from '@mui/icons-material/CheckBoxOutlineBlank';
import { grey } from '@mui/material/colors';
import React, { Component } from 'react';
import { FormattedMessage } from 'react-intl';
import { connect } from 'react-redux';

import { Button, Container, Divider, Grid } from '@mui/material';
import { withStyles } from '@mui/styles';

import PropTypes from 'prop-types';

import {
    LoadingSpinner,
    commonStyles,
    injectIntl,
} from 'bluesquare-components';
import { LinksCompare } from './LinksCompareComponent.tsx';

import { fetchLinkDetail } from '../../../utils/requests';

import MESSAGES from '../messages.ts';

const styles = theme => ({
    ...commonStyles(theme),
    root: {
        cursor: 'default',
        paddingBottom: theme.spacing(4),
        paddingTop: theme.spacing(4),
        backgroundColor: grey['100'],
    },
});

class LinksDetails extends Component {
    constructor(props) {
        super(props);
        this.state = {
            link: undefined,
            loading: false,
        };
    }

    // eslint-disable-next-line camelcase
    UNSAFE_componentWillMount() {
        this.fetchDetail();
    }

    fetchDetail() {
        const { linkId } = this.props;
        this.setState({
            loading: true,
        });
        fetchLinkDetail(linkId)
            .then(linkDetail => {
                this.setState({
                    link: linkDetail,
                    loading: false,
                });
            })
            .catch(() => {
                this.setState({
                    loading: false,
                });
            });
    }

    render() {
        const {
            intl: { formatMessage },
            classes,
            validateLink,
            validated,
        } = this.props;
        const { link, loading } = this.state;
        return (
            <>
                <Divider />
                <Container maxWidth={false} className={classes.root}>
                    {loading && (
                        <LoadingSpinner
                            message={formatMessage(MESSAGES.loading)}
                        />
                    )}
                    {link && (
                        <>
                            <Grid container spacing={2}>
                                <Grid item xs={6}>
                                    <LinksCompare
                                        validated={validated}
                                        title={formatMessage(
                                            MESSAGES.destination,
                                        )}
                                        link={link.destination}
                                        compareLink={link.source}
                                    />
                                </Grid>
                                <Grid item xs={6}>
                                    <LinksCompare
                                        validated={validated}
                                        title={formatMessage(MESSAGES.origin)}
                                        link={link.source}
                                        compareLink={link.destination}
                                    />
                                </Grid>
                            </Grid>
                            <Grid container spacing={2} justifyContent="center">
                                <Button
                                    className={classes.marginTop}
                                    variant="contained"
                                    color={validated ? 'primary' : 'secondary'}
                                    onClick={() => validateLink()}
                                >
                                    {validated && (
                                        <>
                                            <CheckBox
                                                className={classes.buttonIcon}
                                            />
                                            <FormattedMessage
                                                {...MESSAGES.validated}
                                            />
                                        </>
                                    )}
                                    {!validated && (
                                        <>
                                            <CheckBoxOutlineBlank
                                                className={classes.buttonIcon}
                                            />
                                            <FormattedMessage
                                                {...MESSAGES.notValidated}
                                            />
                                        </>
                                    )}
                                </Button>
                            </Grid>
                        </>
                    )}
                </Container>
            </>
        );
    }
}

LinksDetails.defaultProps = {
    validated: false,
};

LinksDetails.propTypes = {
    classes: PropTypes.object.isRequired,
    intl: PropTypes.object.isRequired,
    dispatch: PropTypes.func.isRequired,
    linkId: PropTypes.number.isRequired,
    validateLink: PropTypes.func.isRequired,
    validated: PropTypes.bool,
};

const MapStateToProps = state => ({
    load: state.load,
});

const LinksDetailsWithIntl = injectIntl(LinksDetails);

export default withStyles(styles)(
    connect(MapStateToProps)(LinksDetailsWithIntl),
);
