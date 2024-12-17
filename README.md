# Infra blockchain

This repository contain all the blockchain related infra code for the [Frak](https://frak.id) project.

## Architecture Overview

The Frak Indexer consists of two main components:

1.**[eRPC](https://github.com/erpc/erpc)**: RPC request caching and load balancing across multiple node providers

2.**[Ponder](https://github.com/ponder-sh/ponder)**: Indexing blockchain events from Frak smart contracts.

Both services are deployed as containerized applications on AWS ECS (Elastic Container Service) using Fargate, with a master Application Load Balancer (ALB) routing traffic between them.

## License

This project is licensed under the GNU GPLv3 License - see the LICENSE file for details.
