# Battleship

A multiplayer web based battleship game.

## Introduction

The official server for the game is reachable at (https://battleship-asad.herokuapp.com)[https://battleship-asad.herokuapp.com].

A game takes place the following way:

* One or more players join the game by connecting on the server.
* The game starts and 5 ships of sizes 2,3,3,4,5 are randomly places on the 10x10 board.
* The players use the left mouse button to click shoot at the cells on the board.
* When a cell is shot, it becomes blue if no boat was hit, it becomes red if a boat was hit and green if the entire boat was sunk.
* When a boat is sunk, the player that shot it last winw a number of points equal to the length of the sunk bot.
* When the last boat is sunk, the player that has the most points wins.
* A messsage is shown to all the players with the end game message and the game restarts after 10 seconds.

## Getting Started

### Prerequisites

* Nodejs >= 8.11.1
* NPM >= 5.6.0

Note that NPM is automatically installed along with Node.JS

### Installing

First download or clone the project with the command `git clone https://github.com/servietsky777/Battleship`, then run `npm install` to install all the dependencies. Finally run the command `node app.js`. The application should be running on localhost on the port 4200 [http://localhost:4200](http://localhost:4200)

It is also very simple to deploy the application on Heroku with the following guide (https://devcenter.heroku.com/articles/github-integration)[https://devcenter.heroku.com/articles/github-integration]. The application will then automatically update whenever there is a commit on the branch master.

## Authors

* **Damien Rochat**
* **Michaël Sandoz**
* **Antoine Drabble**

## License

This project is licensed under the MIT License

## Acknowledgments

MSE HES-SO Advanced Software Architecture and Design course
