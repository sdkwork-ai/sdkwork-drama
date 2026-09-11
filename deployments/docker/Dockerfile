FROM rust:1-bookworm AS builder
WORKDIR /src
COPY . .
RUN cargo build --release -p sdkwork-api-drama-standalone-gateway

FROM debian:bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=builder /src/target/release/sdkwork-api-drama-standalone-gateway /usr/local/bin/sdkwork-api-drama-standalone-gateway
ENV SDKWORK_DRAMA_HTTP_BIND=0.0.0.0:8090
EXPOSE 8090
CMD ["sdkwork-api-drama-standalone-gateway"]
