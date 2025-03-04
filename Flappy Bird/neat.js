class NeatBird {
    constructor(gameWidth, gameHeight, brain = null) {
        this.x = 50;
        this.y = gameHeight / 2;
        this.width = 34;
        this.height = 24;
        this.velocity = 0;
        this.brain = brain || this.createBrain();
        this.fitness = 0;
        this.alive = true;
        this.score = 0;
        this.gameHeight = gameHeight;
        this.gameWidth = gameWidth;
    }

    createBrain() {
        const model = tf.sequential();
        model.add(tf.layers.dense({
            inputShape: [INPUT_NODES],
            units: 6
        }));
        model.add(tf.layers.leakyReLU());
        model.add(tf.layers.dense({
            units: OUTPUT_NODES,
            activation: 'sigmoid'
        }));
        return model;
    }

    think(inputs) {
        return tf.tidy(() => {
            const inputTensor = tf.tensor2d([inputs]);
            const output = this.brain.predict(inputTensor);
            return output.dataSync()[0] > 0.5;
        });
    }

    update(pipes) {
        if (!this.alive) return;

        this.velocity += GRAVITY;
        this.y += this.velocity;

        // Ground collision
        if (this.y + this.height > this.gameHeight - GROUND_HEIGHT) {
            this.y = this.gameHeight - GROUND_HEIGHT - this.height;
            this.alive = false;
            return;
        }

        // Ceiling collision
        if (this.y < 0) {
            this.y = 0;
            this.alive = false;
            return;
        }

        // Pipe collision
        for (const pipe of pipes) {
            if (this.checkCollision(pipe)) {
                this.alive = false;
                return;
            }
        }

        this.fitness++;
        if (pipes.length > 0) {
            // Add score when passing pipes
            const pipe = pipes[0];
            if (!pipe.scored && pipe.x + 52 < this.x) {
                this.score++;
                pipe.scored = true;
            }
        }
    }

    checkCollision(pipe) {
        const birdBox = {
            x: this.x + 5,
            y: this.y + 5,
            width: this.width - 10,
            height: this.height - 10
        };

        // Top pipe collision
        if (birdBox.x < pipe.x + 52 &&
            birdBox.x + birdBox.width > pipe.x &&
            birdBox.y < pipe.height) {
            return true;
        }

        // Bottom pipe collision
        if (birdBox.x < pipe.x + 52 &&
            birdBox.x + birdBox.width > pipe.x &&
            birdBox.y + birdBox.height > pipe.height + pipe.gap) {
            return true;
        }

        return false;
    }

    mutate() {
        tf.tidy(() => {
            const weights = this.brain.getWeights();
            const mutatedWeights = weights.map(w => {
                let tensor = w;
                const shape = w.shape;
                const values = w.dataSync().map(v => {
                    if (Math.random() < MUTATION_RATE) {
                        return v + (Math.random() * 2 - 1) * 0.1;
                    }
                    return v;
                });
                return tf.tensor(values, shape);
            });
            this.brain.setWeights(mutatedWeights);
        });
    }
}

class Population {
    constructor(gameWidth, gameHeight) {
        this.gameWidth = gameWidth;
        this.gameHeight = gameHeight;
        this.birds = Array(POPULATION_SIZE).fill().map(() => 
            new NeatBird(gameWidth, gameHeight));
        this.generation = 1;
        this.bestScore = 0;
        this.bestBird = null;
    }

    update(pipes) {
        let allDead = true;
        this.birds.forEach(bird => {
            if (bird.alive) {
                allDead = false;
                bird.update(pipes);
                
                const inputs = this.getInputs(bird, pipes);
                if (bird.think(inputs)) {
                    bird.velocity = FLAP_SPEED;
                }
            }
        });

        if (allDead) {
            this.nextGeneration();
            return true;
        }
        return false;
    }

    getInputs(bird, pipes) {
        const nearestPipe = this.getNearestPipe(bird, pipes);
        if (!nearestPipe) return [0, bird.y / this.gameHeight, 0, 0];

        return [
            (nearestPipe.x - bird.x) / this.gameWidth,
            bird.y / this.gameHeight,
            (bird.y - nearestPipe.height) / this.gameHeight,
            (nearestPipe.height + nearestPipe.gap - bird.y) / this.gameHeight
        ];
    }

    getNearestPipe(bird, pipes) {
        return pipes.find(pipe => pipe.x + 52 >= bird.x) || null;
    }

    nextGeneration() {
        const bestBirds = this.birds
            .sort((a, b) => b.fitness - a.fitness)
            .slice(0, POPULATION_SIZE / 2);

        if (bestBirds[0].score > this.bestScore) {
            this.bestScore = bestBirds[0].score;
            this.bestBird = bestBirds[0];
        }

        this.birds = [];
        for (let i = 0; i < POPULATION_SIZE; i++) {
            const parent = bestBirds[Math.floor(Math.random() * bestBirds.length)];
            // Create a new bird with a fresh brain
            const child = new NeatBird(this.gameWidth, this.gameHeight);
            
            // Copy the weights from parent to child using tf.tidy
            tf.tidy(() => {
                const parentWeights = parent.brain.getWeights();
                const clonedWeights = parentWeights.map(w => tf.clone(w));
                child.brain.setWeights(clonedWeights);
            });
            
            child.mutate();
            this.birds.push(child);
        }

        this.generation++;
    }

    draw(ctx, sprites, birdFrames, currentFrame) {
        this.birds.forEach(bird => {
            if (bird.alive) {
                // Draw bird with rotation based on velocity
                ctx.save();
                ctx.translate(bird.x + bird.width / 2, bird.y + bird.height / 2);
                ctx.rotate(Math.min(Math.max(bird.velocity * 0.05, -0.5), 0.5));
                
                const frame = birdFrames[currentFrame];
                ctx.drawImage(sprites, frame.x, frame.y, 17, 12,
                    -bird.width / 2, -bird.height / 2, bird.width, bird.height);
                ctx.restore();
            }
        });
    }
} 