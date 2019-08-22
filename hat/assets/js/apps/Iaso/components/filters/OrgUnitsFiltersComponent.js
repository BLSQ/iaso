import React from 'react';
import { injectIntl, FormattedMessage } from 'react-intl';

import PropTypes from 'prop-types';

import { withStyles } from '@material-ui/core';
import Container from '@material-ui/core/Container';
import Grid from '@material-ui/core/Grid';
import Button from '@material-ui/core/Button';

import commonStyles from '../../styles/common';

import {
    search,
    status,
    orgUnitType,
    source,
    shape,
    location,
} from '../../constants/orgUnitsFilters';

import FiltersComponent from './FiltersComponent';

const styles = theme => ({
    ...commonStyles(theme),
});

function OrgUnitsFiltersComponent(props) {
    const {
        params,
        classes,
        baseUrl,
        intl: {
            formatMessage,
        },
        onSearch,
        orgUnitTypes,
        sourceTypes,
    } = props;
    return (
        <Container maxWidth={false} className={classes.whiteContainer}>
            <Grid container spacing={4}>
                <Grid item xs={4}>
                    <FiltersComponent
                        params={params}
                        baseUrl={baseUrl}
                        filters={[
                            search(),
                            source(formatMessage, sourceTypes),
                        ]}
                        onEnterPressed={onSearch}
                    />
                </Grid>
                <Grid item xs={4}>
                    <FiltersComponent
                        params={params}
                        baseUrl={baseUrl}
                        filters={[
                            location(formatMessage),
                            shape(formatMessage),
                        ]}
                    />
                </Grid>
                <Grid item xs={4}>
                    <FiltersComponent
                        params={params}
                        baseUrl={baseUrl}
                        filters={[
                            status(formatMessage),
                            orgUnitType(formatMessage, orgUnitTypes),
                        ]}
                    />
                </Grid>
            </Grid>
            <Grid container spacing={1} justify="flex-end" alignItems="center">
                <Grid item xs={2} container justify="flex-end" alignItems="center">
                    <Button
                        variant="contained"
                        className={classes.button}
                        color="primary"
                        onClick={onSearch}
                    >
                        <FormattedMessage id="iaso.search" defaultMessage="Search" />
                    </Button>
                </Grid>
            </Grid>
        </Container>
    );
}
OrgUnitsFiltersComponent.defaultProps = {
    baseUrl: '',
};

OrgUnitsFiltersComponent.propTypes = {
    intl: PropTypes.object.isRequired,
    classes: PropTypes.object.isRequired,
    params: PropTypes.object.isRequired,
    baseUrl: PropTypes.string,
    onSearch: PropTypes.func.isRequired,
    orgUnitTypes: PropTypes.array.isRequired,
    sourceTypes: PropTypes.array.isRequired,
};

export default withStyles(styles)(injectIntl(OrgUnitsFiltersComponent));
