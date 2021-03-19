/**
 * get the first defaultSource and defaultVersion of an user account
 *
 * @param {Object} user
 * @return {Object}
 */

export const getDefaultSourceVersion = user => {
    const sourceVersion = {
        source: undefined,
        version: undefined,
    };
    if (user.account) {
        if (user.account && user.account.default_version) {
            sourceVersion.version = user.account.default_version;
        }
        if (
            user.account &&
            user.account.default_version &&
            user.account.default_version.data_source
        ) {
            sourceVersion.source = user.account.default_version.data_source;
        }
    }
    return sourceVersion;
};
