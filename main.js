const { restart } = require('nodemon');
const tmi = require('tmi.js');

const fs = require('fs');

const chanelle = "redklebg"
const bot_name = "shifumibotv2_"//BotCulture
// Define configuration options
const opts = {
    identity: {
      // username: "shifumibot",
      // password: "b4ynh51nmim4d0kjm7zzi2hiv48ijs"     i2lcmgltsjm89mybpdn1socl9ginz2    
    username: bot_name,
    password: "i2lcmgltsjm89mybpdn1socl9ginz2"//auth key
    },
    channels: [
    chanelle
    ]
};
// Create a client with our options
const client = new tmi.client(opts);

var target;
var first_player = undefined;
var second_player = undefined;
var game = false ;//Etat de la games

var nb_seconde_rep = 10000;
var temps_de_reponse;
var rep_p1;
var rep_p2;
var nb_seconde_rep_game = 5000;//temps de rep quand la game a commencer 

var tab_rep_player = [];
var J1_a_rep = false;
var J2_a_rep = false;

var timout_duree = 15;

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
        }, 1500);
    });
}

async function timer_rep_accepte(temps) {
    while (temps != 1) {
        temps = await timer_1(temps);
        switch (temps) {
            case 3:
                console.log("Shi");
                message_tchat("Shi");
                break;
            case 2:
                console.log("Fu");
                message_tchat("Fu");
                break;
            case 1:
                console.log("MI");
                message_tchat("MI");
                break;
        }
    };

    game = true;
    rep_p1 = setTimeout(jour_pas_rep_game, nb_seconde_rep_game, first_player);
    rep_p2 = setTimeout(jour_pas_rep_game, nb_seconde_rep_game, second_player);
}


function J2_pasRep(){
    restart_game_msg(` @${second_player} n'as pas repondu il aura donc une pénalité `)
}

function jour_pas_rep_game(joueur=undefined){
    message_tchat(` @${joueur} n'as pas répondu il a donc perdu `);

    if (joueur == first_player){
        change_value(first_player, false);
        change_value(second_player, true);
        client.say(target,`/timeout ${first_player} ${timout_duree} T'a pas rep `);
    }else{
        change_value(second_player, false);
        change_value(first_player, true);
        client.say(target,`/timeout ${second_player} ${timout_duree} T'a pas rep `);
    }
    restart_game()
}

function verif_rep(msg){
    if (msg == "ciseaux" || msg == "kamelciseaux"){
        return "c";
    }
    else if (msg == "pierre" || msg == "kamelpierre"){
        return "p";
    }
    else if (msg == "feuille" || msg == "kamelfeuille"){
        return "f";
    }
    else{
        return false;
    }
}

function seak_winner(tab){
    let j1;
    let j2;
    // console.log(tab)
    if (Object.keys(tab[0])[0] == first_player){
        j1 = Object.values(tab[0])[0];
        j2 = Object.values(tab[1])[0];
    }
    else{
        j1 = Object.values(tab[1])[0];
        j2 = Object.values(tab[0])[0];
    }
    // console.log(j1)
    // console.log(j2)
    // console.log(first_player)
    if (j1 == j2)
        return "Draw";
    if ( (j1 == 'p' && j2 == 'c') || (j1 == 'c' && j2 == 'f') || (j1 == 'f' && j2 == 'p')){
        return "J1";
    }
    else{
        return "J2";
    };
};

function palmares(user_palpalmares) {//fonction qui repond a la commande palmares 
    let user_in_top_3 = false;
    let index_player = -1;
    let tab_top_3 = [];
    let nb_points;
    fs.readFile('./db/db_palmares.json', 'utf8', function (err, file) {
        let all_data = JSON.parse(file);

        for (let i = 0; i < 3; i++) {
            if ((all_data[i] != undefined) && (Object.keys(all_data[i])[0] == user_palpalmares)) {
                user_in_top_3 = true;
                index_player = i + 1;
            };
            all_data[i] != undefined ? tab_top_3.push(all_data[i]) : tab_top_3.push("");
        };
        
        if (user_in_top_3 == false)
            index_player = all_data.findIndex(x => Object.keys(x)[0] == user_palpalmares) + 1;
        if (index_player == 0 || user_in_top_3 == true) {

            message_tchat(message_palmares(tab_top_3, "", "", ""))

            return;
        }
        else {
            nb_points = Object.values(all_data[index_player - 1])[0].win;
            message_tchat(message_palmares(tab_top_3, user_palpalmares, index_player, nb_points));

            return;
        };

    });
};
// palmares("tituse3")


function message_palmares(tab_user, user_palpalmares, classement, nb_points) {// fonction qui revoir le message pour le palmares
    let msg_classement = ``;
    tab_user.forEach((x) => { x != "" ? msg_classement += ` ${tab_user.indexOf(x) + 1}° ${Object.keys(x)[0]} (${Object.values(x)[0].win} win / ${Object.values(x)[0].nb_game} game) |` : "" });
    if (user_palpalmares != "" && classement != "")
        msg_classement += ` ... ${classement}° ${user_palpalmares} (${nb_points} win) | `;

    return msg_classement;
};

function creat_player(player) {// fonction qui crée un player si il existe pas 
    fs.readFile('./db/db_palmares.json', 'utf8', function (err, file) {
        let all_data = JSON.parse(file);
        let obj = {};
        obj[player] = {"win" : 0, "nb_game" : 0, "nb_protect" : 3};
        all_data.push(obj);
        all_data = JSON.stringify(all_data);
        fs.writeFileSync("./db/db_palmares.json", all_data);
    });
};

//creat_player("tituse1")

function change_value(target, win) {// fonction qui change les points d'un player 
    fs.readFile('./db/db_palmares.json', 'utf8', function (err, file) {
        let all_data = JSON.parse(file);
        if (all_data.find(x => Object.keys(x)[0] == target) != undefined) {

            all_data[all_data.findIndex(x => Object.keys(x)[0] == target)][target].nb_game += 1;
            if (win == true)
                all_data[all_data.findIndex(x => Object.keys(x)[0] == target)][target].win  += 1;

        }
        else {
            creat_player(target);
            change_value(target, win);
        };

        all_data.sort(compare);

        all_data = JSON.stringify(all_data);
        fs.writeFileSync("./db/db_palmares.json", all_data);
    });
};


function compare( a, b ) {// fonction pour le classemnt dans historique player (avec le sort des donners )
    const valueA = Object.values(a)[0].win;
    const valueB = Object.values(b)[0].win;
    if ( valueA > valueB ){
        return -1;
    }
    if ( valueA < valueB ){
        return 1;
    }
    return 0;
};

//target = pseudo , context = toute les info sur le user , msg = le message , self = au bot  
function commandeHandler(targe , context, msg, self){// fonction appeler a chaque message du tchat 
    if (self) { return; }; // Pour que le bot ne considère pas ces propres messages

    target = targe;

    let message = msg.trim();// supp white space 

    if (message === "!opgg" && game == false ){//regarde la commande de lancement de party 
        message_tchat(`https://euw.op.gg/summoner/userName=mdvfjz`);
        return;
    };

    if (message === "!discord" && game == false ){//regarde la commande de lancement de party 
        message_tchat(`https://discord.com/invite/ub7qy56X`);
        return;
    };

    if (message[0] == "!"){//regarde utilisation commande
        if (message.split(' ')[0].substr(1) == "shifumi" && game == false ){

            message_tchat(` @${context['display-name']} Voici les commandes disponible : !start //pseudo adversaire// | ! palmares `);
            return;
        };

        if (message.split(' ')[0].substr(1) == "palmares" && game == false ){

            palmares(context['display-name']);
            return;
        };


        if (message.split(' ').length == 1){
            message_tchat(` @${context['display-name']} Tu dois identifier une personne pour lancer la partie ! `);
            return;
        };

        if (message.split(' ')[0].substr(1) == "start" && game == false ){//regarde la commande de lancement de party 
            first_player = context['display-name']; 

            if (message.split(' ')[1][0] == "@"){
                second_player = message.split(' ')[1].substr(1).toLowerCase();
            }
            else{
                second_player = message.split(' ')[1].toLowerCase();
            }

            if (second_player == bot_name.toLowerCase()){
                restart_game_msg(`@${first_player} tu ne peux pas défier le bot !`);
                return;
            };

            getChatters(chanelle, (response) => {
                let tab = [...response.chatters.broadcaster, ...response.chatters.viewers, ...response.chatters.vips, ...response.chatters.moderators, ...response.chatters.staff, ...response.chatters.admins];

                console.log(tab)

                if (tab.indexOf(second_player) == -1){
                    //don't start match 2 choix : pas la || il s'identfie dans le message 
                    restart_game_msg(` @${second_player} n'est pas la !`);
                }
                else if (first_player == second_player){
                    restart_game_msg(` @${first_player} tu ne peux pas faire une partie avec toi même`);
                }
                else{
                    message_tchat(` ${second_player} veut tu accepter la demande de match de @${first_player} ? si oui ecrit accepte sinon refus `);
                    game = "waiting response";

                    temps_de_reponse = setTimeout(J2_pasRep, nb_seconde_rep);//on stocke la fct qui s'active si le j2 ne repond pas dans le temps inpartie
                };
            });
        };
    };


    if (context['display-name'].toLowerCase() == second_player && game == "waiting response"){//recuperation ou non de l'accaptations ou non de la partie par le P2 

        clearTimeout(temps_de_reponse);//On enlève le timer qui pesait sur le temsps de réponse pour accepter la game car il a rep 

        if (message.toLowerCase() == "accepte"){
            message_tchat(`@${first_player} , @${second_player} Tenais vous prêt la partie va commencer dans 10 secondes !`);

            console.log("start");

            timer_rep_accepte(4);

        }
        else {
            console.log("refuse");
            restart_game_msg(`@${second_player} n'a pas accepter de jouer .`);
        };
    };

    if (game == true){
        if ((context['display-name'].toLowerCase() == first_player) && (J1_a_rep == false)){
                clearTimeout(rep_p1);
                final_msg = verif_rep(msg.toLowerCase());
                if (final_msg == false){
                    message_tchat(`@${second_player} a gagner car @${first_player} n'a pas bien répondu`);

                    change_value(second_player, true);
                    change_value(first_player, false);

                    client.say(target,`/timeout ${first_player} ${timout_duree} T'a pas rep donc ta perdu`);

                    restart_game();
                };

                let obj = {};
                obj[first_player] = final_msg;
                tab_rep_player.push(obj);

                J1_a_rep = true;
        }
        else if((context['display-name'].toLowerCase() == second_player) && (J2_a_rep == false)){
                clearTimeout(rep_p2);
                final_msg = verif_rep(msg.toLowerCase());

                if (final_msg == false){

                    message_tchat(`@${first_player} a gagner car @${second_player} n'a pas bien répondu`);
        
                    change_value(first_player, true);
                    change_value(second_player, false);

                    client.say(target,`/timeout ${second_player} ${timout_duree} T'a pas rep `);

                    restart_game();
                };

                let obj = {};
                obj[second_player] = final_msg;
                tab_rep_player.push(obj);

                J2_a_rep = true;
        }


        if (tab_rep_player.length == 2){
            console.log(tab_rep_player)
            console.log(first_player)

            switch(seak_winner(tab_rep_player)){
                case "Draw" :
                    message_tchat(`@${first_player} , @${second_player} Egalité on recommence dans 10 secondes`);

                    restart_game_for_darw();

                    break;
                case "J1" :

                    message_tchat(`@${first_player} a gagner GG a lui `);

                    client.say(target,`/timeout ${second_player} ${timout_duree} T'a perdu `);
                    change_value(first_player, true);
                    change_value(second_player, false);


                    restart_game();

                    break;
                default ://J2 win

                    message_tchat(`@${second_player} a gagner GG a lui `);

                    client.say(target,`/timeout ${first_player} ${timout_duree} T'a perdu `);

                    change_value(second_player, true);
                    change_value(first_player, false);

                    
                    restart_game();

                    break;
            }
        }
    }
};

