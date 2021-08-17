const readline = require('readline');
const { ESTALE } = require('constants');
const fs = require('fs');


const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

var tabCommande = ["Change anwsert time on acceptation", "Change anwsert time on Game", "Change timeout length", "Change imunity length", "Change ShiFuMi Timer launch", "Exit"];

function QuestionCommand(){
    rl.question(`What do you want ? \n - ${tabCommande.join(' \n - ')}\n> `, (answer) => {
        let rep = tabCommande.find(element=>(element === element || element.toLowerCase() === answer.toLowerCase()));
        switch (rep) {
            case ("Change anwsert time on acceptation" || tabCommande.indexOf("Change anwsert time on acceptation")):
                ChangeTime("StartGame" || tabCommande.indexOf("Change anwsert time on acceptation"));
                break;    
            case ("Change anwsert time on Game"):
                ChangeTime("RepGame" || tabCommande.indexOf("Change anwsert time on Game"));    
                break;
            case ("Change timeout length"):
                ChangeTime("Timeout" || tabCommande.indexOf("Change timeout length"));        
                break;      
            case ("Change imunity length"):
                ChangeTime("Immunite" || tabCommande.indexOf("Change imunity length"));        
                break;         
            case ("Change ShiFuMi Timer launch"):
                ChangeTime("ShiFuMi" || tabCommande.indexOf("Change ShiFuMi Timer launch"));        
                break;              
            case ("Exit"):
                console.log("Bye Bye !" || tabCommande.indexOf("Exit"));
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
    let TimeData = fs.readFileSync('./TimeFile.json');
    TimeData = JSON.parse(TimeData);

    switch (variable) {
        case "StartGame":
            rl.question(`How much time for the new acceptation time (in seconde) ? `, (NewTime) => {
                if(parseInt(NewTime)){
                    TimeData["NbSecondeAccepte"] = parseInt(NewTime) * 1000;
                    console.log(`The acceptation time is now at ${TimeData["NbSecondeAccepte"]/1000} seconde`);
                    fs.writeFileSync('./TimeFile.json', JSON.stringify(TimeData));
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
                    TimeData["NbSecondeRep"] = parseInt(NewTime) * 1000;
                    console.log(`The reponse in game time is now at ${TimeData["NbSecondeRep"]/1000} seconde`);
                    fs.writeFileSync('./TimeFile.json', JSON.stringify(TimeData));
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
                    TimeData["Timeout"] = parseInt(NewTime);
                    console.log(`The timeout time is now at ${TimeData["Timeout"]} seconde`);
                    fs.writeFileSync('./TimeFile.json', JSON.stringify(TimeData));
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
                    TimeData["ImmuniterTime"] = parseInt(NewTime)*1000;
                    console.log(`The immunity time is now at ${TimeData["ImmuniterTime"]/1000} seconde`);
                    fs.writeFileSync('./TimeFile.json', JSON.stringify(TimeData));
                }
                else{
                    ChangeTime("Immunite");
                }
                setTimeout(QuestionCommand, 1000);
            });
            break;
        case "ShiFuMi":
            rl.question(`How much time for the new ShifuMi Time (in seconde) ? `, (NewTime) => {
                if(parseInt(NewTime)){
                    TimeData["TempsShiFuMi"] = parseInt(NewTime)*1000;
                    console.log(`The immunity time is now at ${TimeData["TempsShiFuMi"]/1000} seconde`);
                    fs.writeFileSync('./TimeFile.json', JSON.stringify(TimeData));
                }
                else{
                    ChangeTime("Immunite");
                }
                setTimeout(QuestionCommand, 1000);
            });
    }
}
QuestionCommand();