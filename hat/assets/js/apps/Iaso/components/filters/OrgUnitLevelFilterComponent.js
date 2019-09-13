import React, { Component, Fragment } from 'react';
import { injectIntl } from 'react-intl';

import PropTypes from 'prop-types';

import FiltersComponent from './FiltersComponent';

import { orgUnitLevel } from '../../constants/filters';

class OrgUnitLevelFilterComponent extends Component {
    render() {
        const {
            orgUnits,
            intl: {
                formatMessage,
            },
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
            orgUnits.forEach((o) => {
                if (o.id !== currentOrgUnitId) {
                    orgUnitsList.push(o);
                }
            });
            if (levelId === currentOrgUnitId) {
                currentLevelId = undefined;
            }
        }
        if (orgUnitsList.length === 0) return null;
        return (
            <Fragment>
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
            </Fragment>
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
