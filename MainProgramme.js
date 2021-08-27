require('dotenv').config()
const tmi = require('tmi.js');
const {MongoClient} = require('mongodb');
const fs = require('fs');
const fetch = require('node-fetch');

// Define configuration options
const opts = {
    identity: {
    username: process.env.BOT_NAME,
    password: process.env.PASSWORD//auth key
    },
    channels: [
        "redklebg"
    ]
};
// Create a client with our options
const client = new tmi.client(opts);

var first_player = {UserID:0, Username:"", Rep:false, Reponse : -1}, second_player={UserID:0, Username:"", Rep:false, Reponse : -1};
var Rep_Acceptation;
var J1_Rep, J2_Rep;
var GameStatus = "F";//Etat de la game : F pas de Game , w Attente de reponse , T Game en cours

var TimeData;
function ReadFileValue(){
    TimeData = fs.readFileSync('./TimeFile.json');
    TimeData = JSON.parse(TimeData);
};
if (TimeData === undefined){
    ReadFileValue();
};
fs.watchFile('./TimeFile.json', {bigint: false, persistent: true, interval: 4000}, ReadFileValue);

const ciseaux = 0, pierre=1, feuille=2;
const TabCiseaux = ["ciseaux","ciseau","ciso", "kamelciso"], TabPierre = ["pierre","kamelpierre", "cailloux", "caillou"], TabFeuille = ["feuilles","feuille","kamelfeuille", "papier", "papie"];
var target;
const BodyReward = {
    title: "Defier quelqu'un au ShiFuMi",
    cost: TimeData["reward cost"],
    prompt:"Regles du Shifumi : Identifie une personnes sur le tchat pour jouer contre lui (sous la forme @<UserName>), Ensuite ecris pierre, feuille ou ciseaux apres le compteure pour jouer ! Bon jeux !",
    background_color:"#000000",
    is_user_input_required:true,
    is_global_cooldown_enabled:true,
    global_cooldown_seconds:200000,
};
var TabMongo;
var Reward = {ID:0, RedemptionID:0};

function ChatLog(msg){
    client.say(target, msg);
};
function LunchGame(){
    let temps = 4;
    ChatLog(`${first_player.Username} et ${second_player.Username}, Teners vous prèts la partie commence dans ${4*TimeData["ShiFuMi timer"]/1000} seconde !`);
    let intervalle = setInterval(()=>{
        temps = temps - 1;
        switch (temps) {
            case 3:
                ChatLog("Shi");
                return;
            case 2:
                ChatLog("Fu");
                return;
            case 1:
                ChatLog("Mi");
                GameStatus = "T";//On lance la Game
                J1_Rep = setTimeout(Player_Not_Answer, TimeData["anwsert time on Game"], first_player);
                J2_Rep = setTimeout(Player_Not_Answer, TimeData["anwsert time on Game"], second_player);
                clearInterval(intervalle);
                return;
        };
    }, TimeData["ShiFuMi timer"]);
    return;
};
async function Restart(){
    first_player = {UserID:0, Username:"", Rep:false, Reponse : -1}, second_player={UserID:0, Username:"", Rep:false, Reponse : -1};
    GameStatus = "F";
    clearTimeout(Rep_Acceptation);
    clearTimeout(J1_Rep);
    clearTimeout(J2_Rep);
    Reward = {ID:0, RedemptionID:0};
};

function Probability(rating1, rating2){
    return 1.0 / (1 + Math.pow(10, - 1 * ((rating1 - rating2) / 400)))
};
function EloWin(Winnner, Loser){
    let Resulte = [];
    let K1 = 40, K2 = 40;
    if(Winnner !== undefined && Loser !== undefined){
        K1 = Winnner.Game > TimeData["placement Game number"] ? 20 : 40;
        K2 = Loser.Game > TimeData["placement Game number"] ? 20 : 40;
        Resulte.push(K1*(1-Probability(Winnner.Elo, Loser.Elo)));
        Resulte.push(K2*(0-Probability(Loser.Elo, Winnner.Elo)));
    }
    else if(Winnner !== undefined && Loser === undefined){
        K1 = Winnner.Game > TimeData["placement Game number"] ? 20 : 40;
        Resulte.push(K1*(1-Probability(Winnner.Elo, TimeData["start elo"])));
        Resulte.push(K2*(0-Probability(TimeData["start elo"], Winnner.Elo)));
    }
    else if(Winnner === undefined && Loser !== undefined){
        K2 = Loser.Game > TimeData["placement Game number"] ? 20 : 40;
        Resulte.push(K1*(1-Probability(TimeData["start elo"], Loser.Elo)));
        Resulte.push(K2*(0-Probability(Loser.Elo, TimeData["start elo"])));
    }
    else {
        Resulte.push(K1*(1-Probability(TimeData["start elo"], TimeData["start elo"])));
        Resulte.push(K2*(0-Probability(TimeData["start elo"], TimeData["start elo"])));
    };
    Resulte[0] = Math.round(Resulte[0]);
    Resulte[1] = Math.round(Resulte[1]);
    return Resulte;
};

async function IdUser(user){
    const response = await fetch(`https://api.twitch.tv/helix/users?login=${user.toLowerCase()}`, {'method': 'GET', 'headers': {'Authorization': process.env.AUTHORIZATION_CHANELLE, 'Client-Id': process.env.CLIENT_ID}})
        .catch(err => { console.log(err); return "0000"});
    const json = await response.json();
    if (json.data !== undefined){
        return json.data[0].id;
    }else {
        IdUser(user);
    }
};
async function EndGame(){
    let User1, User2;
    let elo_p2;
    ChatLog(`${first_player.Username} la partie ne va pas commencer car ${second_player.Username} n'a pas accepter ton duel .`)
    await Find_Data_DB([]);
    second_player.UserID = second_player.UserID === 0 && await IdUser(second_player.Username);
    User1 = TabMongo.find(element=>element.UserId === first_player.UserID.toString());
    User2 = TabMongo.find(element=>element.UserId === second_player.UserID.toString());
    if (User2 !== undefined && new Date() - User2.Imune <= TimeData["imunity length"]){
        ChatLog(`${second_player.Username} a une immuniter il ne vas donc pas perdre d'elo pour ce refus .`)
    }else{
        elo_p2 = EloWin(User1, User2);
        await Add_Data_DB({UserId:second_player.UserID}, {"$setOnInsert" : {"User" : second_player.Username, "UserId" : second_player.UserID, "Elo" : TimeData["start elo"], "Game" : 0, "Victoire" : 0}});
        await Add_Data_DB({UserId:second_player.UserID}, {"$inc" : {"Elo" : elo_p2[1]}, "$set":{"Imune" : new Date()}});
    };
    restart_redemption(true);
    return;
};
async function Player_Elo_Gain(Winnner, Perdant){
    let Elo_Tab;
    await Find_Data_DB([]);
    second_player.UserID = second_player.UserID === 0 && await IdUser(second_player.Username);
    let User1 = TabMongo.find(element=>element.UserId === Winnner.UserID.toString());
    let User2 = TabMongo.find(element=>element.UserId === Perdant.UserID.toString());
    if (User1 === undefined){
        await Add_Data_DB({UserId:Winnner.UserID}, {"$setOnInsert" : {"User" : Winnner.Username, "UserId" : Winnner.UserID, "Elo" : TimeData["start elo"], "Game" : 0, "Victoire" : 0}});
    };
    if(User2 === undefined){
        await Add_Data_DB({UserId:Perdant.UserID}, {"$setOnInsert" : {"User" : Perdant.Username, "UserId" : Perdant.UserID, "Elo" : TimeData["start elo"], "Game" : 0, "Victoire" : 0}});
    };
    Elo_Tab = EloWin(User1, User2);
    await Add_Data_DB({UserId:Winnner.UserID}, {"$inc" : {"Elo" : Elo_Tab[0], "Game" : 1, "Victoire" : 1}, "$set":{"User" : Winnner.Username}});
    await Add_Data_DB({UserId:Perdant.UserID}, {"$inc" : {"Elo" : Elo_Tab[1], "Game" : 1}, "$set":{"User" : Perdant.Username, "Imune" : new Date()}});
    return;
};
function Player_Not_Answer(Player){
    ChatLog(`/timeout ${Player.Username} ${TimeData["timeout length"]} T'a pas repondu !`)
    if (Player === first_player){
        ChatLog(`${second_player.Username} a gagner car ${first_player.Username} n'a pas repondu !`);
        Player_Elo_Gain(second_player, first_player);
        restart_redemption(false);
        clearTimeout(J2_Rep);
    }else{
        ChatLog(`${first_player.Username} a gagner car ${second_player.Username} n'a pas repondu !`);
        Player_Elo_Gain(first_player, second_player);
        restart_redemption(true);
    };
};

function GetUserInChat(){
    client.api({
        url: "http://tmi.twitch.tv/group/user/" + opts.channels[0].replace('#','') + "/chatters",
        method: "GET"
    }, function(err, res, body) {
        if (err ){
            console.log(err)
        };
        let UserArray = [...body.chatters.broadcaster, ...body.chatters.viewers, ...body.chatters.vips, ...body.chatters.moderators, ...body.chatters.staff, ...body.chatters.admins];
        if (UserArray.find(element=>element===second_player.Username)){
            GameStatus = "W";
            ChatLog(`@${second_player.Username} veut tu accepter le duel de ${first_player.Username} ? accepte/refuse`);
            Rep_Acceptation = setTimeout(()=>{ChatLog(`@${first_player.Username} la partie ne va pas commencer car ${second_player.Username} n'a pas repondu !`); EndGame();}, TimeData["anwsert time acceptation"]);
        }else{
            ChatLog(`@${first_player.Username} la partie ne va pas commencer car ${second_player.Username} n'est pas la !`);
            restart_redemption(true);
        };
        return;
    });
};

function AnswerPlayer(msg){
    msg = msg.split(' ')[0];
    if (TabCiseaux.find(element=>msg === element)){
        return ciseaux;
    }else if (TabPierre.find(element=>msg === element)){
        return pierre;
    }else if (TabFeuille.find(element=>msg === element)){
        return feuille;
    }else{
        return -1;
    };
};

function Rule_Winner(first_playerRep, second_playerRep){
    if (first_playerRep === second_playerRep){
        ChatLog('Draw on recommence !');
        first_player.Rep = false;
        second_player.Rep = false;
        first_player.Reponse = -1;
        second_player.Reponse = -1;
        LunchGame();
        return;
    }else if((first_playerRep === pierre && second_playerRep === ciseaux) || (first_playerRep === ciseaux && second_playerRep === feuille) || (first_playerRep === feuille && second_playerRep == pierre)){
        ChatLog(`${first_player.Username} a gagner GG a lui !`);
        Player_Elo_Gain(first_player, second_player);
        ChatLog(`/timeout ${second_player.Username} ${TimeData["timeout length"]} T'a perdu !`);
        restart_redemption(true);
    }else{
        ChatLog(`${second_player.Username} a gagner GG a lui !`);
        Player_Elo_Gain(second_player, first_player);
        ChatLog(`/timeout ${first_player.Username} ${TimeData["timeout length"]} T'a perdu !`);
        restart_redemption(false);
    };
    return;
};


async function Add_Data_DB(Find, Data){
    const client = await MongoClient.connect(process.env.URL, { useNewUrlParser: true })
    .catch(err => { console.log(err); });
    if (!client)
        return;

    try {
        const db =  client.db("ShifumiBot").collection('UserAccount');
        await db.updateOne(Find, Data, {upsert : true});//{UserId : IdUser1}, {$inc:{Victoire:1, Game : 1}, $setOnInsert : {User : Gagnant, UserId : IdUser1, Elo : TimeData["start elo"]+EloArray[0]}}, 
    } catch (err) {
        console.log(err);
    } finally {
        client.close();
        return;
    };
};
async function Find_Data_DB(query){
    const client = await MongoClient.connect(process.env.URL, { useNewUrlParser: true })
        .catch(err => { console.log(err); });
    if (!client)
        return;

    try {
        const db =  client.db("ShifumiBot").collection('UserAccount');
        let res = await db.aggregate(query).toArray();
        TabMongo = res;
    } catch (err) {
        console.log(err);
    } finally {
        client.close();
        return;
    };
};
async function palmares(User){
    let msg_classement = ``;
    await Find_Data_DB([{"$sort":{Elo :-1}}]);
    TabMongo.forEach((x) => {if(TabMongo.indexOf(x) < 3) msg_classement += ` ${TabMongo.indexOf(x) + 1}° ${x.User} (${x.Victoire} w/${x.Game}) |`});
    if (TabMongo.find(element=>element.User===User) !== undefined && TabMongo.indexOf(TabMongo.find(element=>element.User===User)) > 2)
        msg_classement += ` ... ${TabMongo.indexOf(TabMongo.find(element=>element.User===User))+1}° ${User} (${TabMongo.find(element=>element.User===User).Victoire} w/${TabMongo.find(element=>element.User===User).Game}) | `;
    ChatLog(msg_classement !== "" ? msg_classement : "Personne n'a encore jouer soit le premier :)");
    return;
};
async function GetEloPlayer(User){
    await Find_Data_DB([{"$match":{User :User}}]);
    ChatLog(TabMongo.length !== 0 ? `@${User} tu a ${TabMongo[0].Elo} d'elo` : `@${User} tu n'a pas encore jouer tu n'a donc pas d'elo`);
    return;
};
async function Imuniter(User){
    await Find_Data_DB([{"$match":{User :User}}]);
    ChatLog(TabMongo.length !== 0 ? `@${User} tu a ${new Date() - TabMongo[0].Imune <= TimeData["imunity length"] ? Math.round(((TimeData["imunity length"] - (new Date() - TabMongo[0].Imune)) / 60000)%60) + " minute" : "plus"} d'Imuniter` : `@${User} tu n'a pas encore jouer tu n'a donc pas d'Imuniter`);
    return;
};



async function restart_redemption(Win){
    let statueRdemption = Win ? "CANCELED" : "FULFILLED";
    await GetRedemptionId();
    fetch(
        `https://api.twitch.tv/helix/channel_points/custom_rewards/redemptions?id=${Reward.RedemptionID}&broadcaster_id=${process.env.BROADCASTERID}&reward_id=${Reward.ID}`,
        {'method': 'PATCH', 'headers': {'Authorization': process.env.AUTHORIZATION_CHANELLE, 'Client-Id': process.env.CLIENT_ID, 'Content-Type': 'application/json'}, 'body' : JSON.stringify({status: statueRdemption})}
    ).then((res)=> {return res.json()}).then(DeleteReward).then(Restart).then(ManageReward);
};
async function GetRedemptionId(){
    let redemeption = await fetch(`https://api.twitch.tv/helix/channel_points/custom_rewards/redemptions?broadcaster_id=${process.env.BROADCASTERID}&reward_id=${Reward.ID}&status=UNFULFILLED`,{'method': 'GET', 'headers': {'Authorization': process.env.AUTHORIZATION_CHANELLE, 'Client-Id': process.env.CLIENT_ID}});
    redemeption = await redemeption.json();
    Reward.RedemptionID = redemeption.data[0].id;
    return;
};
async function DeleteReward(){
    let res = await fetch(
        `https://api.twitch.tv/helix/channel_points/custom_rewards?broadcaster_id=${process.env.BROADCASTERID}&id=${Reward.ID}`,
        {'method': 'DELETE', 'headers': {'Authorization': process.env.AUTHORIZATION_CHANELLE, 'Client-Id': process.env.CLIENT_ID}}
    );
    if (res.status!==204){
        console.log(res);
    };
};
async function ManageReward(){
    let RewardTab = await fetch(`https://api.twitch.tv/helix/channel_points/custom_rewards?broadcaster_id=${process.env.BROADCASTERID}`, {'method': 'GET', 'headers': {'Authorization': process.env.AUTHORIZATION_CHANELLE, 'Client-Id': process.env.CLIENT_ID}});
    RewardTab = await RewardTab.json();
    if(RewardTab.data !== undefined && RewardTab.data.find(element=>element.title === BodyReward.title) !== undefined){
        Reward.ID = RewardTab.data.find(element=>element.title === BodyReward.title).id;
        if (!RewardTab.data.find(element=>element.title === BodyReward.title).is_in_stock){
            restart_redemption(true);
        };
        return;
    }else{
        RewardTab = await fetch(`https://api.twitch.tv/helix/channel_points/custom_rewards?broadcaster_id=${process.env.BROADCASTERID}`, {'method': 'POST', 'headers': {'Authorization': process.env.AUTHORIZATION_CHANELLE, 'Client-Id': process.env.CLIENT_ID, 'Content-Type' : 'application/json'}, 'body' : JSON.stringify(BodyReward)});
        if(RewardTab.status === 200){
            RewardTab = await RewardTab.json()
            Reward.ID = RewardTab.data[0].id;
            return;
        }else {
            ManageReward();
        };
    };
};

ManageReward();

function commandeHandler(ShiFuMiBot, context, msg, self){// fonction appeler a chaque message du tchat 
    if (target === undefined){target = ShiFuMiBot;};
    if (self) { return;}; // Pour que le bot ne considère pas ces propres messages

    const message = msg.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").split(' ')[0];//Formate the user message 
    const User = context['username'].toLowerCase();

    if (GameStatus === "F" && message[0] === "!"){//regarde utilisation commande
        switch(message){
            case "!shifumi" :
                ChatLog(` @${User} Commande disponible : !palmares | !elo | !immuniter`);
                break;
            case "!regles" :
                ChatLog(` @${User} les regles ....`);
                break;
            case "!palmares" :
                palmares(User);
                break;
            case "!elo" :
                GetEloPlayer(User);
                break;
            case "!immuniter" :
                Imuniter(User);
                break;
        };
        return;
    }else if(context["custom-reward-id"] === Reward.ID){
        first_player.Username = User;
        first_player.UserID = context['user-id'];
        second_player.Username = message[0] === '@' ? message.replace('@', '') : message;
        switch(second_player.Username){
            case first_player.Username : 
                ChatLog(`@${first_player.Username} Tu ne peux pas te défier toi même !`);
                restart_redemption(true);
                return;
            case process.env.BOT_NAME : 
                ChatLog(`@${first_player.Username} Tu ne peux pas defier le bot !!`);
                restart_redemption(true);
                return;
        };
        GetUserInChat();
    }else if (GameStatus === "W" && User === second_player.Username){
        second_player.ID = context["user-id"];
        if (message ===  "accepte" || message === "accepter") {
            clearTimeout(Rep_Acceptation);
            LunchGame();
            return;
        }else if(message === "refuse" || message === "refuser"){
            clearTimeout(Rep_Acceptation);
            EndGame();
            return;
        };
    }else if (GameStatus === "T"){
        if (User === first_player.Username && !first_player.Rep){
            clearTimeout(J1_Rep);
            first_player.Rep = true;
            first_player.Reponse = AnswerPlayer(message);
            if (first_player.Reponse === -1){
                ChatLog(`${second_player.Username} a gagner car ${first_player.Username} n'a pas bien répondu !`);
                Player_Elo_Gain(second_player, first_player);
                ChatLog(`/timeout ${first_player.Username} ${TimeData["timeout length"]} T'a pas bien repondu !`);
                restart_redemption(false);
                return;
            };
        }else if(User === second_player.Username && !second_player.Rep){
            clearTimeout(J2_Rep);
            second_player.Rep = true;
            second_player.Reponse = AnswerPlayer(message);
            if (second_player.Reponse === -1){
                ChatLog(`${first_player.Username} a gagner car ${second_player.Username} n'a pas bien répondu !`);
                Player_Elo_Gain(first_player, second_player);
                ChatLog(`/timeout ${second_player.Username} ${TimeData["timeout length"]} T'a pas bien repondu !`);
                restart_redemption(true);
                return;
            };
        };
        if (first_player.Rep && second_player.Rep){
            Rule_Winner(first_player.Reponse, second_player.Reponse);
        };
    };
};


client.on('message', commandeHandler);
client.connect();