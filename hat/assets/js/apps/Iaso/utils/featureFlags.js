export const EDIT_GEO_JSON_RIGHT = 'ALLOW_SHAPE_EDITION';
export const EDIT_CATCHMENT_RIGHT = 'ALLOW_CATCHMENT_EDITION';
export const SHOW_PAGES = 'SHOW_PAGES';
export const HIDE_PERIOD_QUARTER_NAME = 'HIDE_PERIOD_QUARTER_NAME';
export const SHOW_DHIS2_LINK = 'SHOW_DHIS2_LINK';
export const SHOW_LINK_INSTANCE_REFERENCE = 'SHOW_LINK_INSTANCE_REFERENCE';
export const SHOW_BENEFICIARY_TYPES_IN_LIST_MENU =
    'SHOW_BENEFICIARY_TYPES_IN_LIST_MENU';
export const SHOW_DEV_FEATURES = 'SHOW_DEV_FEATURES';
export const SHOW_HOME_ONLINE = 'SHOW_HOME_ONLINE';

/**
 * Check if current user has a feature flag active
 *
 * @param {Object} currentUser
 * @param {featureKey} featureKey
 * @return {Boolean}
 */
export const hasFeatureFlag = (currentUser, featureKey) =>
    Boolean(currentUser?.account?.feature_flags?.includes(featureKey));
