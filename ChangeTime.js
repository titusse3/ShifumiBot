const readline = require('readline');
const { ESTALE } = require('constants');
const fs = require('fs');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

var tabCommande = ["anwsert time acceptation", "anwsert time on Game", "timeout length", "imunity length", "ShiFuMi timer", "start elo", "placement Game number", "reward cost", "exit"];

function QuestionCommand(){
    rl.question(`What do you want ? \n - Change ${tabCommande.slice(0,-1).join(' \n - Change ') + '\n - ' + tabCommande[tabCommande.length-1]}\n> `, (answer) => {
        let reponse = !isNaN(answer) ? parseInt(answer) : tabCommande.indexOf(answer.toLowerCase().replace("change ", ""));
        if(reponse === tabCommande.length || answer.toLowerCase() === "exit"){
            console.log("Thanks for using this console ! \n bye bye !!");
            rl.close();
            return;
        }else if(tabCommande[reponse-1] !== undefined){
            ChangeData(reponse - 1);
        }else{
            console.log('Command invalid . Please write a valid answer .');
            setTimeout(QuestionCommand, 1000);
        };
    });
};

function ChangeData(variable){
    let DataSetup = fs.readFileSync('./Data/TimeFile.json');
    DataSetup = JSON.parse(DataSetup);

    rl.question(`How mutch time for the new ${tabCommande[variable]} ? `, (NewTime) => {
        if(!isNaN(NewTime)){
            DataSetup[tabCommande[variable]] = parseInt(NewTime);
            console.log(`The time ${tabCommande[variable]} is now at : ${DataSetup[tabCommande[variable]]}`);
            fs.writeFileSync('./Data/TimeFile.json', JSON.stringify(DataSetup));
        }
        else{
            ChangeData(variable);
        }
        setTimeout(QuestionCommand, 1000);
    });
};
QuestionCommand(tabCommande);