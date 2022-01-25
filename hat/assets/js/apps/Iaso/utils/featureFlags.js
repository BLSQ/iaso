export const EDIT_GEO_JSON_RIGHT = 'ALLOW_SHAPE_EDITION';
export const EDIT_CATCHMENT_RIGHT = 'ALLOW_CATCHMENT_EDITION';
export const SHOW_PAGES = 'SHOW_PAGES';
export const HIDE_PERIOD_QUARTER_NAME = 'HIDE_PERIOD_QUARTER_NAME';

/**
 * Check if current user has a feature flag active
 *
 * @param {Object} currentUser
 * @param {featureKey} featureKey
 * @return {Boolean}
 */
export const hasFeatureFlag = (currentUser, featureKey) =>
    Boolean(currentUser?.account?.feature_flags?.includes(featureKey));
