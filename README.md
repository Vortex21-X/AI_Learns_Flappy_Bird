# NEAT Flappy Bird AI - Developed By Arjun Shah

A neural network-powered implementation of Flappy Bird using the NEAT (NeuroEvolution of Augmenting Topologies) algorithm. This project demonstrates how artificial intelligence can learn to play Flappy Bird through evolutionary algorithms.

## Features

- **Neural Network Visualization**: Real-time display of the neural network's decision-making process
- **Population Statistics**: Live tracking of generation count, alive birds, and scores
- **Advanced Game Mechanics**: Accurate physics and collision detection matching the original game
- **Learning Visualization**: Watch the AI improve over generations
- **Performance Stats**: Real-time display of distance to pipes, bird position, and gap measurements

## Technical Details

- **Neural Network Structure**:
  - Input Layer: 4 nodes (distance to pipe, bird Y-position, gap to top pipe, gap to bottom pipe)
  - Hidden Layer: 6 nodes with Leaky ReLU activation
  - Output Layer: 1 node (flap decision)
- **Evolution Parameters**:
  - Population Size: 50 birds per generation
  - Mutation Rate: Configurable for weights and biases
  - Selection: Top performers used for next generation

## Setup

1. Open `index.html` in a modern web browser (Chrome recommended)

 Watch the AI learn to play! Each generation will get better at navigating the pipes.

## How It Works

The NEAT algorithm evolves both the weights and structure of the neural network:

1. Each bird has a neural network brain that takes in game state as input
2. Networks make decisions whether to flap based on inputs
3. Birds that survive longer and score higher are selected for breeding
4. New generation inherits and mutates successful strategies
5. Process repeats, improving performance over time

## Controls

- **Space/Click**: Manual flap (if you want to play yourself)
- **Restart Button**: Reset the current generation
- The game automatically starts with AI control

## Dependencies

- TensorFlow.js (loaded via CDN)
- Modern web browser with JavaScript enabled

## License

MIT License - feel free to use and modify for your own projects! 
