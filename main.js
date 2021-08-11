require('dotenv').config()
const tmi = require('tmi.js');
const {MongoClient} = require('mongodb');
const readline = require('readline');
const { ESTALE } = require('constants');


const chanelle = "redklebg"
// Define configuration options
const opts = {
    identity: {
    username: process.env.BOT_NAME,
    password: process.env.PASSWORD//auth key
    },
    channels: [
    chanelle
    ]
};
// Create a client with our options
const client = new tmi.client(opts);

var target, temps_de_reponse;
var first_player = undefined, second_player=undefined;
var game = false ;//Etat de la games
var nb_seconde_rep = 30000, nb_seconde_rep_game = 4500, timout_duree= 15, TempsImuniter = 3600000;
var rep_p1, rep_p2;
var tab_rep_player = [];
var J1_a_rep = false, J2_a_rep=false;
var ciseaux = 0, pierre=1,feuille=2;
var TabCiseaux = ["ciseaux","ciseau","ciso", "kamelciso"], TabPierre = ["pierre","kamelpierre", "cailloux", "caillou"], TabFeuille = ["feuilles","feuille","kamelfeuille"];
var tabCommande = ["Change anwsert time on acceptation", "Change anwsert time on Game", "Change timeout length", "Change imunity length", "Exit"];

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function QuestionCommand(){
    rl.question(`What do you want ? \n - ${tabCommande.join(' \n - ')}\n> `, (answer) => {
        let rep = tabCommande.find(element=>element.toLowerCase() === answer.toLowerCase());
        switch (rep) {
            case "Change anwsert time on acceptation":
                ChangeTime("StartGame");
                break;    
            case "Change anwsert time on Game":
                ChangeTime("RepGame");    
                break;
            case "Change timeout length":
                ChangeTime("Timeout");        
                break;      
            case "Change imunity length":
                ChangeTime("Immunite");        
                break;                    
            case "Exit":
                console.log("Bye Bye !");
                rl.close();
                break;
            default:
                console.log('Command invalid . Please write a valid answer .');
                setTimeout(QuestionCommand, 2000);
                break;
        }
    });
};

function ChangeTime(variable){
    switch (variable) {
        case "StartGame":
            rl.question(`How much time for the new acceptation time (in seconde) ? `, (NewTime) => {
                if(parseInt(NewTime)){
                    nb_seconde_rep = parseInt(NewTime) * 1000;
                    console.log(`The acceptation time is now at ${nb_seconde_rep/1000} seconde`);
                }
                else{
                    ChangeTime("StartGame");
                }
                setTimeout(QuestionCommand, 1000);
            });
            break;
        case "RepGame":
            rl.question(`How much time for the new reponse in game (in seconde) ? `, (NewTime) => {
                if(parseInt(NewTime)){
                    nb_seconde_rep_game = parseInt(NewTime) * 1000;
                    console.log(`The reponse in game time is now at ${nb_seconde_rep_game/1000} seconde`);
                }
                else{
                    ChangeTime("RepGame");
                }
                setTimeout(QuestionCommand, 1000);
            });
            break;
        case "Timeout":
            rl.question(`How much time for the new timout in game (in seconde) ? `, (NewTime) => {
                if(parseInt(NewTime)){
                    timout_duree = parseInt(NewTime);
                    console.log(`The timeout time is now at ${timout_duree} seconde`);
                }
                else{
                    ChangeTime("Timeout");
                }
                setTimeout(QuestionCommand, 1000);
            });
            break;
        case "Immunite":
            rl.question(`How much time for the new immunity value (in seconde) ? `, (NewTime) => {
                if(parseInt(NewTime)){
                    TempsImuniter = parseInt(NewTime)*1000;
                    console.log(`The immunity time is now at ${TempsImuniter/1000} seconde`);
                }
                else{
                    ChangeTime("Immunite");
                }
                setTimeout(QuestionCommand, 1000);
            });
            break;
    }
}

QuestionCommand();

client.on('message', commandeHandler);
// Connect to Twitch:
client.connect();

function getChatters(channel, callback){
    client.api({
        url: "http://tmi.twitch.tv/group/user/" + channel + "/chatters",
        method: "GET"
    }, function(err, res, body) {
        if (err ){
            console.log(err)
        };

        callback(body);
    });
};

function restart_game_msg(msg){
    message_tchat(`La partie ne vas pas commencer car ${msg}`);
    first_player = undefined;
    second_player = undefined;
    game = false ;
    J1_a_rep = false;
    J2_a_rep = false;
    tab_rep_player = [];
    clearTimeout(rep_p1);
    clearTimeout(rep_p2);
    clearTimeout(temps_de_reponse);
};

function restart_game(){
    first_player = undefined;
    second_player = undefined;
    game = false ;
    J1_a_rep = false;
    J2_a_rep = false;
    tab_rep_player = [];
    clearTimeout(rep_p1);
    clearTimeout(rep_p2);
    clearTimeout(temps_de_reponse);
};

function restart_game_for_darw(){
    game = true;
    J1_a_rep = false;
    J2_a_rep = false;
    tab_rep_player = [];
    clearTimeout(rep_p1);
    clearTimeout(rep_p2);
    clearTimeout(temps_de_reponse);
    timer_rep_accepte(4);
}

function message_tchat(msg){
    client.say(target,`/me : ${msg}`);
};

function timer_1(temps) {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve(temps - 1);
        }, 2500);
    });
}

async function timer_rep_accepte(temps) {
    while (temps != 1) {
        temps = await timer_1(temps);
        switch (temps) {
            case 3:
                message_tchat("Shi");
                break;
            case 2:
                message_tchat("Fu");
                break;
            case 1:
                message_tchat("MI");
                break;
        }
    };

    game = true;
    rep_p1 = setTimeout(jour_pas_rep_game, nb_seconde_rep_game, first_player);

    rep_p2 = setTimeout(jour_pas_rep_game, nb_seconde_rep_game, second_player);
}

async function Imuniter(UserCommande){
    const uri = process.env.URL;
    const client = new MongoClient(uri);
    
    try {
        await client.connect();
        const collection = await client.db("ShifumiBotV2").collection('Palmares');
        const user = await collection.find({User : UserCommande.toLowerCase()}).toArray();
        if(user.length === 0){
            message_tchat(`@${UserCommande} tu n'a encore jamais joué tu n'a donc pas d'imuniter`);
        }
        else{
            message_tchat(`@${UserCommande} tu a ${new Date() - user[0].Imune <= TempsImuniter ? Math.round(((TempsImuniter - (new Date() - user[0].Imune)) / 60000)%60) + " minute" : "plus"} d'Imuniter`);
        }
    } catch (e) {
        console.error(e);
    } finally {
        await client.close();
        return;
    }
}



async function Penaliter(user){
    const uri = "mongodb+srv://Tituse:Theo76160@cluster0.lj1ma.mongodb.net/test?retryWrites=true&w=majority";
    const client = new MongoClient(uri);
    
    try {
        await client.connect();
        const collection = await client.db("ShifumiBotV2").collection('Palmares');
        let userObj = await collection.find({User:user}).toArray();
        if ( userObj.length === 1){
            await collection.updateOne({User : user}, {$set : {Imune: new Date()}});
        }
        else {
            await collection.updateOne({User : user}, {$setOnInsert:{User : user, Victoire:0, Game : 0, Imune : new Date()}}, {upsert : true});
        }
    } catch (e) {
        console.error(e);
    } finally {
        await client.close();
    }
}

function jour_pas_rep_game(joueur=undefined){
    message_tchat(` @${joueur} n'as pas répondu il a donc perdu `);

    if (joueur == first_player){
        Resultat(first_player, second_player, "Lose");
        client.say(target,`/timeout ${first_player} ${timout_duree} T'a pas rep `);
    }else{
        Resultat(first_player, second_player, "Win");
        client.say(target,`/timeout ${second_player} ${timout_duree} T'a pas rep `);
    }
    restart_game()
}

function VerifRep(msg){
    msg = msg.split(' ')[0];
    if (TabCiseaux.find(element=>msg === element) !== undefined){
        return ciseaux;
    }
    else if (TabPierre.find(element=>msg === element) !== undefined){
        return pierre;
    }
    else if (TabFeuille.find(element=>msg === element) !== undefined){
        return feuille;
    }
    else{
        return -1;
    }
}


function SeakWinner(tab){
    let j1;
    let j2;
    if (Object.keys(tab[0])[0] == first_player){
        j1 = Object.values(tab[0])[0];
        j2 = Object.values(tab[1])[0];
    }
    else{
        j1 = Object.values(tab[1])[0];
        j2 = Object.values(tab[0])[0];
    }
    if (j1 == j2)
        return "Draw";
    if ( (j1 === pierre && j2 === ciseaux) || (j1 === ciseaux && j2 === feuille) || (j1 === feuille && j2 == pierre)){
        return "J1";
    }
    else{
        return "J2";
    };
};

async function palmares(userPalmares) {//fonction qui repond a la commande palmares 

    const uri = "mongodb+srv://Tituse:Theo76160@cluster0.lj1ma.mongodb.net/test?retryWrites=true&w=majority";
    const client = new MongoClient(uri);

    try {

        await client.connect();
        const collect = await client.db("ShifumiBotV2").collection('Palmares');
        const tabTop3 = await collect.find().sort({Victoire : -1}).limit(3).toArray();
        let allUser;
        let User;
        let classement;

        if(tabTop3.find(element=>element.User === userPalmares) !== undefined){
            message_tchat(message_palmares(tabTop3));
        }
        else{
            allUser = await collect.find().toArray();
            User = allUser.find(element => element.User === userPalmares);
            classement = allUser.indexOf(User) + 1;
            if (User !== undefined){
                message_tchat(message_palmares(tabTop3, User, classement));
            }
            else{
                message_tchat(message_palmares(tabTop3));
            }
        }
    } catch (e) {
        console.error(e);
    } finally {
        await client.close();
        return;
    }
};



function message_palmares(tab_user, user, classement) {// fonction qui revoir le message pour le palmares
    let msg_classement = ``;
    tab_user.forEach((x) => { msg_classement += ` ${tab_user.indexOf(x) + 1}° ${x.User} (${x.Victoire} win / ${x.Game} game) |`});
    if (user != undefined)
        msg_classement += ` ... ${classement}° ${user.User} (${user.Victoire} win / ${user.Game} game) | `;

    return msg_classement !== "" ? msg_classement : "Personne n'a encore jouer soit le premier :)";
};

async function Resultat(user1, user2, resulte){
    const uri = "mongodb+srv://Tituse:Theo76160@cluster0.lj1ma.mongodb.net/test?retryWrites=true&w=majority";
    const client = new MongoClient(uri);

    try {
        await client.connect();
        const collection = await client.db("ShifumiBotV2").collection('Palmares');
        if (resulte === "Win"){
            await collection.updateOne({User : user1}, {$inc:{Victoire:1, Game : 1}, $set : {User : user1}}, {upsert : true});
            await collection.updateOne({User : user2}, {$inc:{Victoire:0, Game : 1}, $set : {User : user2, Imune : new Date()}}, {upsert : true});
        }
        else{
            await collection.updateOne({User : user1}, {$inc:{Victoire:0, Game : 1}, $set : {User : user1}}, {upsert : true});
            await collection.updateOne({User : user2}, {$inc:{Victoire:1, Game : 1}, $set : {User : user2, Imune : new Date()}}, {upsert : true});
        }
    } catch (e) {
        console.error(e);
    } finally {
        await client.close();
        return;
    }
}

async function ImuniterUser(user){
    const uri = "mongodb+srv://Tituse:Theo76160@cluster0.lj1ma.mongodb.net/test?retryWrites=true&w=majority";
    const client = new MongoClient(uri);

    try {
        await client.connect();
        const collect = await client.db("ShifumiBotV2").collection('Palmares');
        const User = await collect.find({User:user}).toArray();
        if(User.length === 1 && new Date() - User[0].Imune <= TempsImuniter){
            restart_game_msg(`${second_player} a une imuniter tu ne peux donc pas le défier`);
        }
    } catch (e) {
        console.error(e);
    } finally {
        await client.close();
        return;
    }
}

function J2PasRep(){
    client.say(target,`/timeout @${second_player} ${timout_duree} T'a pas rep `);
    Penaliter(second_player)
    restart_game_msg(`@${second_player} n'a pas répondu il aura donc une pénaliter !`);
}

//target = pseudo , context = toute les info sur le user , msg = le message , self = au bot  
function commandeHandler(targe , context, msg, self){// fonction appeler a chaque message du tchat 
    if (self) { return; }; // Pour que le bot ne considère pas ces propres messages

    target = targe;

    let message = msg.trim();// supp white space 

    if (message.toLowerCase() === "!opgg" && game == false ){//regarde la commande de lancement de party 
        message_tchat(`https://euw.op.gg/summoner/userName=mdvfjz`);
        return;
    };

    if (message.toLowerCase() === "!discord" && game == false ){//regarde la commande de lancement de party 
        message_tchat(`https://discord.com/invite/ub7qy56X`);
        return;
    };

    if (message.toLowerCase() === "!immunite" && game == false ){//regarde la commande de lancement de party 
        Imuniter(context['display-name'].toLowerCase());
    };

    if (message[0] == "!"){//regarde utilisation commande
        if (message.split(' ')[0].substr(1) == "shifumi" && game == false ){

            message_tchat(` @${context['display-name']} Voici les commandes disponible : !duel //pseudo adversaire// | ! palmares | !immunite `);
            return;
        };

        if (message.split(' ')[0].substr(1) == "palmares" && game == false ){

            palmares(context['display-name'].toLowerCase());
        };


        if (message === "!duel"){
            message_tchat(` @${context['display-name']} Tu dois identifier une personne pour lancer la partie ! `);
            return;
        };

        if (message.split(' ')[0].substr(1) === "duel" && game == false ){//regarde la commande de lancement de party 
            first_player = context['display-name'].toLowerCase(); 

            if (message.split(' ')[1][0] == "@"){
                second_player = message.split(' ')[1].substr(1).toLowerCase();
            }
            else{
                second_player = message.split(' ')[1].toLowerCase();
            }

            if (second_player === process.env.BOT_NAME.toLowerCase()){
                restart_game_msg(`@${first_player} tu ne peux pas défier le bot !`);
                return;
            };
            if (first_player === second_player){
                restart_game_msg(` @${first_player} tu ne peux pas faire une partie avec toi même`);
                return;
            }

            getChatters(chanelle, (response) => {
                let tab = [...response.chatters.broadcaster, ...response.chatters.viewers, ...response.chatters.vips, ...response.chatters.moderators, ...response.chatters.staff, ...response.chatters.admins];

                if (tab.indexOf(second_player) === -1){
                    //don't start match 2 choix : pas la || il s'identfie dans le message 
                    restart_game_msg(` @${second_player} n'est pas la !`);
                    return;
                }
                else{
                    ImuniterUser(second_player);
                    message_tchat(` ${second_player} veut tu accepter la demande de match de @${first_player} ? si oui ecrit accepte sinon refus `);
                    game = "waiting response";
                    temps_de_reponse = setTimeout(J2PasRep, nb_seconde_rep);//on stocke la fct qui s'active si le j2 ne repond pas dans le temps inpartie
                    return;
                };
            });
        };
    };


    if (context['display-name'].toLowerCase() === second_player && game == "waiting response"){//recuperation ou non de l'accaptations ou non de la partie par le P2 

        clearTimeout(temps_de_reponse);//On enlève le timer qui pesait sur le temsps de réponse pour accepter la game car il a rep 

        if (message.toLowerCase() == "accepte" || message.toLowerCase() == "accepter"){
            message_tchat(`@${first_player} , @${second_player} Tenais vous prêt la partie va commencer dans 10 secondes !`);
            timer_rep_accepte(4);
        }
        else if(message.toLowerCase() == "refuse" || message.toLowerCase() == "refuser"){
            // console.log("refuse");
            // Penaliter(second_player);
            // client.say(target,`/timeout @${second_player} ${timout_duree} T'a pas rep `);
            restart_game_msg(`@${second_player} n'a pas accepter de jouer . @${first_player} tu peux toujours défier quelqu'un d'autre :) `);
            return;
        };
    };

    if (game == true){
        if ((context['display-name'].toLowerCase() == first_player) && (J1_a_rep == false)){
                clearTimeout(rep_p1);
                final_msg = VerifRep(msg.toLowerCase());
                if (final_msg === -1){
                    message_tchat(`@${second_player} a gagner car @${first_player} n'a pas bien répondu`);

                    Resultat(first_player, second_player, "Lose");

                    client.say(target,`/timeout ${first_player} ${timout_duree} T'a pas rep donc ta perdu`);

                    restart_game();
                    return;
                };

                let obj = {};
                obj[first_player] = final_msg;
                tab_rep_player.push(obj);

                J1_a_rep = true;
        }
        else if((context['display-name'].toLowerCase() == second_player) && (J2_a_rep == false)){
                clearTimeout(rep_p2);
                final_msg = VerifRep(msg.toLowerCase());

                if (final_msg == -1){

                    message_tchat(`@${first_player} a gagner car @${second_player} n'a pas bien répondu`);
        
                    Resultat(first_player, second_player, "Win");

                    client.say(target,`/timeout ${second_player} ${timout_duree} T'a pas rep `);

                    restart_game();
                    return;
                };

                let obj = {};
                obj[second_player] = final_msg;
                tab_rep_player.push(obj);

                J2_a_rep = true;
        }


        if (tab_rep_player.length == 2){
            switch(SeakWinner(tab_rep_player)){
                case "Draw" :
                    message_tchat(`@${first_player} , @${second_player} Egalité on recommence dans 10 secondes`);

                    restart_game_for_darw();
                    return;

                    break;
                case "J1" :

                    message_tchat(`@${first_player} a gagner GG a lui `);

                    client.say(target,`/timeout ${second_player} ${timout_duree} T'a perdu `);
                    Resultat(first_player, second_player, "Win");

                    restart_game();
                    return;

                    break;
                default ://J2 win

                    message_tchat(`@${second_player} a gagner GG a lui `);
                    client.say(target,`/timeout ${first_player} ${timout_duree} T'a perdu `);
                    Resultat(first_player, second_player, "Lose");
                    restart_game();
                    return;

                    break;
            }
        }
    }
};

