# sdkwork-drama cloud container image.
# Single image + environment-specific configuration (no per-environment
# image forks); secrets are injected at runtime, never baked in.

FROM rust:1-bookworm AS build
WORKDIR /build
# Sibling SDKWork sources are provided by the packaging pipeline checkout.
COPY Cargo.toml rust-toolchain.toml ./
COPY crates ./crates
COPY database ./database
RUN cargo build --release -p sdkwork-api-drama-standalone-gateway

FROM debian:bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates && rm -rf /var/lib/apt/lists/*
COPY --from=build /build/target/release/sdkwork-api-drama-standalone-gateway /usr/local/bin/sdkwork-api-drama-standalone-gateway
COPY database /app/database
ENV SDKWORK_DRAMA_APP_ROOT=/app
ENV SDKWORK_DRAMA_HTTP_BIND=0.0.0.0:8090
EXPOSE 8090
USER 65532:65532
ENTRYPOINT ["/usr/local/bin/sdkwork-api-drama-standalone-gateway"]
