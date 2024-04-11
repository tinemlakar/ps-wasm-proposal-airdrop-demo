set -e

docker build -t ps-wasm-proposal-airdrop .
docker tag ps-wasm-proposal-airdrop ps-wasm-proposal-airdrop:latest
# docker save -o ps-wasm-proposal-airdrop.tar ps-wasm-proposal-airdrop:latest