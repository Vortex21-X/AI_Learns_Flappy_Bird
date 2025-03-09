# NEAT Flappy Bird AI

A Flappy Bird game where AI birds learn to play through evolution! Watch 50 birds with tiny neural network brains figure out how to navigate pipes, passing their skills to the next generation. See their decision-making in real-time and track their improvement across generations.

## Features

- **Neural Network Visualization**: Real-time display of the network's decision-making process
- **Population Statistics**: Live tracking of generation count, alive birds, and scores
- **Advanced Game Mechanics**: Accurate physics and collision detection matching the original game
- **Learning Visualization**: Watch the AI improve over generations
- **Performance Stats**: Real-time display of distance to pipes, bird position, and gap measurements

## Technical Details

### Neural Network Structure
- Input Layer: 4 nodes (distance to pipe, bird Y-position, gap to top pipe, gap to bottom pipe)
- Hidden Layer: 6 nodes with Leaky ReLU activation
- Output Layer: 1 node (flap decision)

### Evolution Parameters
- Population Size: 50 birds per generation
- Mutation Rate: Configurable for weights and biases
- Selection: Top performers used for next generation

### Mathematical Model
The neural network uses the following functions:

**Hidden Layer Activation (Leaky ReLU):**
```
h = LeakyReLU(w₁x₁ + w₂x₂ + w₃x₃ + w₄x₄ + b)

where LeakyReLU(x) = x if x > 0
                     0.01x if x ≤ 0
```

**Output Layer (Sigmoid):**
```
output = sigmoid(v₁h₁ + v₂h₂ + v₃h₃ + v₄h₄ + v₅h₅ + v₆h₆ + b_out)
sigmoid(x) = 1 / (1 + e^(-x))
```

## Controls
- **Space/Click**: Manual flap (if you want to play)
- **Restart Button**: Reset the current generation

## Setup
1. Clone the repository
2. Open `index.html` in a modern web browser (Chrome recommended)
3. Watch the AI learn to play!

## Dependencies
- TensorFlow.js (loaded via CDN)
- Modern web browser with JavaScript enabled

## License
MIT License - feel free to use and modify for your own projects!