class FrontendBundleError(Exception):
    pass


class FrontendBundleLoaderBadStatsError(FrontendBundleError):
    pass


class FrontendBundleLoaderTimeoutError(FrontendBundleError):
    pass


class FrontendBundleLookupError(FrontendBundleError):
    pass
