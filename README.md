# ShifumiBot
Shifumi Twitch bot . You can play Shifumi on a twitch tchat (ther is a ladders and penality if you lose).

---
## Requirements

For development, you will only need Node.js and a node global package, Npm, installed in your environement.

### Node
- #### Node installation on Windows

  Just go on [official Node.js website](https://nodejs.org/) and download the installer.
Also, be sure to have `git` available in your PATH, `npm` might need it (You can find git [here](https://git-scm.com/)).

- #### Node installation on Ubuntu

  You can install nodejs and npm easily with apt install, just run the following commands.

      $ sudo apt install nodejs
      $ sudo apt install npm

- #### Other Operating Systems
  You can find more information about the installation on the [official Node.js website](https://nodejs.org/) and the [official NPM website](https://npmjs.org/).

If the installation was successful, you should be able to run the following command.

    $ node --version
    v8.11.3

    $ npm --version
    6.1.0

If you need to update `npm`, you can make it using `npm`! Cool right? After running the following command, just open again the command line and be happy.

    $ npm install npm -g

###

## Install

    $ git clone https://github.com/titusse3/ShifumiBot.git
    $ cd ShifumiBot
    $ npm install

## Configure app

Add a file call `.env` with the following writing :

BOT_NAME=Your bot name
PASSWORD=Your bot secret tokens
URL=Your link to your Atlas DB

## Get Your bot name and secret tokens

creat a twitch user (the user your bot will use), go there to get the tokens while login to the accounts of your bot https://twitchtokengenerator.com/#:~:text=To%20use%20the%20tool%2C%20simply,appear%20here...%22%20.
Add the username and the tokens of your bot in the .env file

## Get Mongo Url of your Atlas db

Go to https://www.mongodb.com/fr-fr and creat a 3 nodes db . 
Go to connect and select "Connect to your application" and copy the link to your env file 
(somethink like this mongodb+srv://UserName:Password@YourCluster.mongodb.net)

## Running the project

    $ npm start
