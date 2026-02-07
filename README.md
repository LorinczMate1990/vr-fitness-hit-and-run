# Introduction

In my opinion, VR is not as hyped as it should be. It could be used a lot of things and creating softwares for VR is easy since browsers support it. This game is a proof of concept training software that wraps the training into a fight simulator with strategic elements.

My goal is to create a game where hitting hard and moving quickly (on your own foot) is almost everything. 

In its current version, there is a tree, that tries to grow while three red orbs try to "eat" it. When they can feed on the tree, it shrinks.

Your task is to protect the tree with your blades. You can hit the orbs. If you just touch them, they stop, but if you hit them fast enough, they will retreat. They retreat further if you hit them harder.

The game is more like an AR than a VR, because it shows your real environment, for two reasons:
- You have to hit hard here. You want to see where you hit with your expensive controllers
- By allowing you to see the real environment, you can maximize the game area and the primary goal here is to train

# Future plans

## Making the orbs smarter

The game is not satisfying in its current state. After some minutes of gameplay, you will realize that if you heard the orbs correctly, you don't really have to move, you just have to play tennis with them. My current goal is to set the orb speed properly and give them some maneuvering, where they actively try to void you while eating the tree, not just blindly crash into you

## Adding upgrades to your weapons

The tree is meant to be some kind of money. You will be able to spend it to longer blades and different things.

## Adding multiple enemies

The orbs are quick but simple enemies, you hit them, they flee.
I want to add additional enemies that makes you do different kicks and tactics. For example:
- A slow, but steady "tank"-like enemy: It will go towards to the tree, with a slow pace, when you hit it, it will be blocked for a short time. It will only disappear when you hit it enough
  - This will make you hit it like a punching bag
- A shooting enemy that will disable your blade if hits you
  - This will make you move

## Adding tower-defense like mechanics

To break the monotony, the number of enemies will be increased over time and they can only be keeping at bay by special defense structures.

## Making infinite game world

This is just an idea yet, but when you press a button, you will be able to "freeze" the rotation of every actors while you rotate in the physical world. With this, you would be able to run trough your whole base.

## Fitness stats

This is a fitness program at first, so you may be interested in stats about your punching numbers, punching strength, total distance, etc...

# Development

I had some experience with low-level graphics and OpenGL, but not with VR development or tree.js, so I use Claude with Sonnet 4.5 to make this development faster.

## Prompts

When I use prompts, I try to be transparent with it and put it on the git commit message, I want to use this project as a case study of AI tools.

## My experiences so long

Claude can speed up the development, it's easy to do huge refactos (see commits), but you must never let it make architectural decisions. The original code is unmaintainable.

# Deployment

This will be deployed to Github Pages, but currently it is not worth to play with it.