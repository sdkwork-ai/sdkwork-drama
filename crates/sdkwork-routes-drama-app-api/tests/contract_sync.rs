//! Contract synchronization test: the Rust route manifest and the OpenAPI
//! contract authority (`apis/open-api/drama/drama-app-api.openapi.json`)
//! must describe the same operations — method, path, operation id, and auth
//! mode (public vs dual-token). Drift in either direction fails this test.
//!
//! Authority: `../sdkwork-specs/API_SPEC.md`, `TEST_SPEC.md` §2.1.

use std::collections::BTreeMap;
use std::path::PathBuf;

use sdkwork_web_contract::RouteAuth;

#[derive(Debug)]
struct ContractOperation {
    operation_id: String,
    is_public: bool,
}

fn openapi_path() -> PathBuf {
    PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .join("../../apis/open-api/drama/drama-app-api.openapi.json")
}

fn openapi_operations() -> BTreeMap<(String, String), ContractOperation> {
    let text = std::fs::read_to_string(openapi_path())
        .expect("openapi contract file must exist next to the route crate");
    let document: serde_json::Value = serde_json::from_str(&text).expect("openapi must be JSON");
    let mut operations = BTreeMap::new();
    let paths = document
        .get("paths")
        .and_then(|value| value.as_object())
        .expect("openapi must declare paths");
    for (path, item) in paths {
        for (method, operation) in item.as_object().expect("path item must be an object") {
            let method = method.to_ascii_uppercase();
            if !matches!(method.as_str(), "GET" | "POST" | "PATCH" | "PUT" | "DELETE") {
                continue;
            }
            let operation_id = operation
                .get("operationId")
                .and_then(|value| value.as_str())
                .expect("every operation must declare operationId")
                .to_string();
            let is_public = match operation.get("security") {
                Some(security) => security
                    .as_array()
                    .is_some_and(|entries| entries.is_empty()),
                None => false,
            };
            operations.insert(
                (method, path.clone()),
                ContractOperation {
                    operation_id,
                    is_public,
                },
            );
        }
    }
    operations
}

fn manifest_operations() -> BTreeMap<(String, String), (String, bool)> {
    let mut operations = BTreeMap::new();
    for route in sdkwork_routes_drama_app_api::route_manifest().routes() {
        let method = format!("{:?}", route.method)
            .split("::")
            .last()
            .expect("enum path")
            .to_ascii_uppercase();
        let is_public = matches!(route.auth, RouteAuth::Public);
        operations.insert(
            (method, route.path.to_string()),
            (route.operation_id.to_string(), is_public),
        );
    }
    operations
}

#[test]
fn manifest_and_openapi_declare_identical_operations() {
    let openapi = openapi_operations();
    let manifest = manifest_operations();

    let manifest_keys: Vec<_> = manifest.keys().collect();
    let openapi_keys: Vec<_> = openapi.keys().collect();
    assert_eq!(
        manifest_keys, openapi_keys,
        "manifest and OpenAPI must cover the same method+path set"
    );

    for (key, manifest_entry) in &manifest {
        let contract = openapi
            .get(key)
            .unwrap_or_else(|| panic!("openapi missing {key:?} (manifest drift)"));
        assert_eq!(
            &contract.operation_id, &manifest_entry.0,
            "operationId drift for {key:?}: contract={} manifest={}",
            contract.operation_id, manifest_entry.0
        );
        assert_eq!(
            contract.is_public, manifest_entry.1,
            "auth-mode drift for {key:?}: contract public={} manifest public={}",
            contract.is_public, manifest_entry.1
        );
    }
}

#[test]
fn business_operations_stay_dual_token_on_both_sides() {
    for ((method, path), operation) in openapi_operations() {
        if path.contains("/episodes") {
            assert!(
                !operation.is_public,
                "business operation {method} {path} must require dual-token in the contract"
            );
        }
    }
    for ((method, path), (_, is_public)) in manifest_operations() {
        if path.contains("/episodes") {
            assert!(
                !is_public,
                "business operation {method} {path} must require dual-token in the manifest"
            );
        }
    }
}
