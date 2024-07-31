# Frak Indexer

Frak Indexer is an open-source project designed to index events from Frak smart contracts on the Arbitrum Sepolia network. It combines the power of Ponder for building robust crypto apps with eRPC for efficient RPC caching and load balancing, all deployed using SST (Serverless Stack) on AWS infrastructure.

## Architecture Overview

The Frak Indexer consists of two main components:

1. **Ponder Service**: An open-source backend framework for building robust, performant, and maintainable crypto apps. In this project, it's used for indexing blockchain events from Frak smart contracts.

2. **eRPC Service**: A fault-tolerant EVM RPC load balancer with reorg-aware permanent caching and auto-discovery of node providers. It provides a layer of caching on top of other RPCs, enhancing performance and reliability.

Both services are deployed as containerized applications on AWS ECS (Elastic Container Service) using Fargate, with an Application Load Balancer (ALB) routing traffic between them.

## Deployment Architecture

- **VPC**: A dedicated VPC is created to house all components.
- **ECS Cluster**: Both Ponder and eRPC services run in the same ECS cluster.
- **Application Load Balancer**: 
  - Listens on port 80
  - Routes traffic based on path patterns:
    - `/rpc-main/*` -> eRPC service (for cached RPC requests)
    - `/*` (all other paths) -> Ponder service (for indexed data access)
- **CloudFront Distribution**: Sits in front of the ALB to provide additional caching and global content delivery.

## Key Features

- **Efficient Indexing**: Utilizes Ponder to create a robust and maintainable indexing solution for Frak smart contract events.
- **Optimized RPC Access**: eRPC provides caching and load balancing across multiple RPC providers, improving performance and reliability.
- **Scalable**: Utilizes AWS Fargate for serverless container management.
- **High Availability**: Deployed across multiple availability zones.
- **Secure**: Uses AWS security groups and VPC for network isolation.
- **Observable**: Includes CloudWatch logs and metrics for monitoring.
- **Maintainable**: Infrastructure as Code (IaC) using SST for easy updates and version control.

## Deployment

This project uses SST for infrastructure deployment. To deploy:

1. Ensure you have AWS credentials configured.
2. Setup the secrets required to run the project (check the `iac/Config.ts` file for the required secrets).
3. Install dependencies: `pnpm install`
4. Deploy the stack: `npx run deploy`

## Contributing

We welcome contributions to the Frak Indexer project!

## License

This project is licensed under the GNU GPLv3 License - see the LICENSE file for details.
