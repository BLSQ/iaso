import React, { Component, Fragment } from 'react';
import Grid from '@material-ui/core/Grid';

import PropTypes from 'prop-types';

import { injectIntl } from 'bluesquare-components';
import FiltersComponent from '../../../components/filters/FiltersComponent';

import { orgUnitLevel, status } from '../../../constants/filters';

class OrgUnitLevelFilterComponent extends Component {
    render() {
        const {
            orgUnits,
            intl: { formatMessage },
            onFilterChanged,
            levelId,
            levelIndex,
            params,
            baseUrl,
            showCurrentOrgUnit,
            currentOrgUnitId,
        } = this.props;

        if (orgUnits.length === 0) return null;
        let orgUnitsList = [...orgUnits];
        let currentLevelId = levelId;
        if (!showCurrentOrgUnit && currentOrgUnitId) {
            orgUnitsList = [];
            orgUnits.forEach(o => {
                if (o.id !== currentOrgUnitId) {
                    orgUnitsList.push(o);
                }
            });
            if (levelId === currentOrgUnitId) {
                currentLevelId = undefined;
            }
        }
        if (orgUnitsList.length === 0) return null;

        const validationStatus = orgUnitsList.find(
            oU => oU.id === currentLevelId,
        );
        const statusIcons = status(formatMessage).options;
        const statusIcon =
            validationStatus &&
            statusIcons.find(
                icon => icon.value === validationStatus.validation_status,
            ).icon;

        return (
            <>
                <Grid
                    container
                    direction="row"
                    justifyContent="flex-start"
                    alignItems="center"
                    spacing={1}
                >
                    <Grid item xs={statusIcon ? 11 : 12}>
                        <FiltersComponent
                            params={params}
                            baseUrl={baseUrl}
                            filters={[
                                orgUnitLevel(
                                    orgUnitsList,
                                    levelIndex,
                                    value => onFilterChanged(value, levelIndex),
                                    currentLevelId,
                                    formatMessage,
                                ),
                            ]}
                        />
                    </Grid>
                    {statusIcon && (
                        <Grid item xs={1}>
                            <a
                                href={`/dashboard/orgunits/detail/orgUnitId/${currentLevelId}`}
                            >
                                {statusIcon}
                            </a>
                        </Grid>
                    )}
                </Grid>
            </>
        );
    }
}

OrgUnitLevelFilterComponent.defaultProps = {
    orgUnits: [],
    baseUrl: '',
    levelId: null,
    showCurrentOrgUnit: true,
    currentOrgUnitId: null,
};

OrgUnitLevelFilterComponent.propTypes = {
    params: PropTypes.object.isRequired,
    levelId: PropTypes.any,
    levelIndex: PropTypes.number.isRequired,
    intl: PropTypes.object.isRequired,
    onFilterChanged: PropTypes.func.isRequired,
    orgUnits: PropTypes.array,
    baseUrl: PropTypes.string,
    showCurrentOrgUnit: PropTypes.bool,
    currentOrgUnitId: PropTypes.any,
};

export default injectIntl(OrgUnitLevelFilterComponent);
