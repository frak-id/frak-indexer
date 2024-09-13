
const rpcSecrets = [
    new sst.Secret("BLOCKPI_API_KEY_ARB_SEPOLIA"),
    new sst.Secret("ALCHEMY_API_KEY")
]

const pimlicoApiKey = new sst.Secret("PIMLICO_API_KEY")

const ponderRpcSecret = new sst.Secret("PONDER_RPC_SECRET")
const nexusRpcSecret = new sst.Secret("NEXUS_RPC_SECRET")

const ponderDb = new sst.Secret("DATABASE_URL")
const erpcDb = new sst.Secret("ERPC_DATABASE_URL")

export {
    rpcSecrets,
    pimlicoApiKey,
    ponderDb,
    erpcDb,
    ponderRpcSecret,
    nexusRpcSecret,
}