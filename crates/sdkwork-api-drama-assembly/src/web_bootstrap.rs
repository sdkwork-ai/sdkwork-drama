//! Web bootstrap plumbing for the drama assembly.
//!
//! Resolves the IAM web request context resolver per deployment mode:
//! production/staging always resolve through the IAM database session store
//! (`iam_web_request_context_resolver_from_env`), while explicit development
//! environments may use the adapter's unverified dev fallback so a standalone
//! dev box can run without an IAM deployment. The dev fallback never
//! activates in production-like environments.

use sdkwork_iam_web_adapter::{
    IamWebRequestContextResolver, iam_web_request_context_resolver_from_env,
};

pub async fn resolve_web_auth_resolver() -> IamWebRequestContextResolver {
    if sdkwork_iam_web_adapter::allows_dev_authentication_fallback()
        && sdkwork_drama_database_host::is_development_environment()
    {
        tracing::warn!(
            "IAM dev authentication fallback active: dual tokens are parsed without \
             signature or session verification. Never enable outside development."
        );
        IamWebRequestContextResolver::from_database_pool(None)
    } else {
        iam_web_request_context_resolver_from_env().await
    }
}
