set -e

docker build -t ps-wasm-proposal-airdrop-app .
docker tag ps-wasm-proposal-airdrop-app ps-wasm-proposal-airdrop-app:latest
docker save -o ps-wasm-proposal-airdrop-app.tar ps-wasm-proposal-airdrop-app:latest