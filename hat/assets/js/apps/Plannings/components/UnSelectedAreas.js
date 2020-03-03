import React, { useState, Fragment } from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';
import Chip from '@material-ui/core/Chip';
import VisibilityIcon from '@material-ui/icons/Visibility';

import { sortGeoItems } from '../utils/workzonesUtils';
import { formatThousand } from '../../../utils';

function UnSelectedAreas({ areasList, isEndemic, handleSelect }) {
    const [isOpen, setIsOpen] = useState(false);
    const sortedAreasList = sortGeoItems(areasList);
    return (
        <li className={`workzones-item ${isOpen ? ' open' : ''}`}>
            <section>
                <span className="endemic-icon-container">
                    <i className={`fa fa-tint ${isEndemic ? ' endemic' : ''}`} />
                </span>
                <div className={`infos ${areasList.length > 0 ? 'alert' : ''}`}>
                    {
                        areasList.length > 0
                        && (
                            <Fragment>
                                {
                                    isEndemic
                                    && (
                                        <FormattedMessage id="macroplanning.label.unUsedEndemicAreas" defaultMessage="Not assigned endemic area(s)" />
                                    )
                                }
                                {
                                    !isEndemic
                                    && (
                                        <FormattedMessage id="macroplanning.label.unUsedAreas" defaultMessage="Not assigned area(s)" />
                                    )
                                }
                                :
                                <span className="area-count">{areasList.length}</span>
                            </Fragment>
                        )
                    }
                    {
                        areasList.length === 0
                        && (
                            <Fragment>
                                {
                                    isEndemic
                                    && (
                                        <FormattedMessage id="macroplanning.label.allEndemicAreasAssgined" defaultMessage="All endemic health areas are assigned" />
                                    )
                                }
                                {
                                    !isEndemic
                                    && (
                                        <FormattedMessage id="macroplanning.label.allAreasAssgined" defaultMessage="All non endemic health areas are assigned" />
                                    )
                                }
                            </Fragment>
                        )
                    }
                    {
                        isOpen
                        && <i className="fa fa-chevron-down" />
                    }
                    {
                        !isOpen
                        && areasList.length > 0
                        && <i className="fa fa-chevron-right" />
                    }
                </div>
            </section>
            <div
                role="button"
                tabIndex={0}
                className="button"
                onClick={() => setIsOpen(!isOpen)}
            />
            <div className={`expand-collapse ${isOpen ? ' open' : ''}`}>
                {
                    areasList.length > 0
                    && (
                        <div className={`areas-chips-container ${isEndemic ? 'endemic' : ''}`}>
                            {
                                sortedAreasList.map(area => (
                                    <Chip
                                        size="small"
                                        icon={<VisibilityIcon />}
                                        label={`${area.name}${area.endemicPopulation ? ` (${formatThousand(area.endemicPopulation)})` : ''}`}
                                        onClick={() => handleSelect(area)}
                                        key={area.pk}
                                    />
                                ))
                            }
                        </div>
                    )
                }
            </div>
        </li>
    );
}

UnSelectedAreas.defaultProps = {
    isEndemic: false,
    handleSelect: () => null,
};

UnSelectedAreas.propTypes = {
    areasList: PropTypes.array.isRequired,
    isEndemic: PropTypes.bool,
    handleSelect: PropTypes.func,
};

export default UnSelectedAreas;
