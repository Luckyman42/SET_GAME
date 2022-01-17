/* 
WEBFEJLESZTÉS -- 4.Csoprt -- JavaScript beadandó
Szabó Árpád --- DAX8UM
*/

//#region data váriable querySelectorok
    // A kártyákat meghatározó tulajdonságok
let Type =  ["oval", "vawey", "deltoid"];
let Color = ["red", "green", "purple"];
let Count = [1, 2, 3];
let Content = ["dense", "stripey", "empty"];

    //Változók
let focusElements = [];         //Az éppen kijelölt kártyák tömbje, td-ket tárol
let deck = [];                  //A pakli
let actualDeckIndex = 0;        //Hol járunk a pakliban?
let points = [];                //Játkosok pontjait tárolja, a span teget tároljuk benne így könnyebb azok átírása
let playersButton = [];         //Játékosok gombjait tartalmaző tömb
let actualPlayer;               //aktív játékos indexe, ő az aki éppen próbálkozhat set-el
let time = 0;                   //Játékban eltöltött másodpercek
let timer;                      //Időzítő, setInterval-t fogja tárolni
let needThreeCardAuto;          //Egy logikai változó amely azt mondja kell-e autómatikusan +3 lapot hozzáadni vagy sem
let playerInputs = [];          //amikor át akarom nevezni a játékosokat akkor az input mezőket tartalmazza.
let onlyOnePlayer;              //Egy logikai változó amely azt mondja hogy csak 1 játékos van-e vagy több

//#region querySelectors
let gamePlace = document.querySelector("#gamePlace");                       //Játékterület
let tablePlace = document.querySelector("#tablePlace");                     //játék táblájának a helye, itt lesznek a kártyák
let playersPlace = document.querySelector("#playersPlace");                 //Játékosok helye, a gombok a pontok stb
let settingsPlace = document.querySelector("#settings");                    //főmenü/nyitóoldal helye, beállítások vannak itt
let numberOfPlayers = document.querySelector("#numberOfPlayers");           //input mező, mely a játékosok számát mondja meg, (STRING)
let table = document.createElement("table");                                //Játéktábla
let startButton = document.querySelector("#startBut");                      //Start Gomb
let hardRadio = document.querySelector("#hard");                            //játék nehézségének kiválasztásánál a nehéz opció radio gombja
let practiceRadio = document.querySelector("#practice");                    //Játékmódnál a gyakorló opció
let raceRadio = document.querySelector("#race");                            //Játékmódnál a verseny opció
let extraSettingsDiv = document.querySelector("#extraSettings");            //Egyébb beállítások rész, gyakorló módnál
let haveSet = document.querySelector("#haveSetCheckBox");                   //"Van-e Set" gomb igényére állított checkbox
let showSet = document.querySelector("#showSetCheckBox");                   //"Mutass egy Set-et" gomb igényére állított checkbox
let needPlusButtonForFilling = document.querySelector("#plusButton");       //A 3 lapos kiegészítéshez kell-e külön gomb vagy sem, nem esetén automatikus lesz
let playerRenameBlock = document.querySelector("#playerRenameBlock");       //Itt Jelennek majd meg az input mezők a játékosok átnevezésére
let numberOfCards = document.querySelector("#numberOfCards");               //Hátralévő lapok számának megjelenítésére létrehozott span
let elapsedTime = document.querySelector("#elapsedTime");                   //Eltelt idő jelzésére létrehozott span
let timeScreen = document.querySelector("#timeScreen");                     //10mp.es visszaszámlálásra létrehozott span, itt változik a szám
let timeText = document.querySelector("#timeText");                         //10mp.es visszaszámlálásra létrehozott p, ez jelenik meg az elején majd tünik le a végén, egy befoglalóegység
let buttonsPlace = document.querySelector("#buttonsPlace");                 //A generált gombok helye a játékterületen
let gameOverPlace = document.querySelector("#GameOverPlace");               //Játék vége felület helye
//#endregion 
//#endregion

//#region EventListener / timerSlot
    //gyakorló módban kellenek az extra beállítások
practiceRadio.addEventListener('click',()=>{
    extraSettingsDiv.style.display= "inline";
});

    //verseny módban nem kellenek az extra beállítások
raceRadio.addEventListener('click',()=>{
    extraSettingsDiv.style.display= "none";
})
    
    //Játék elindítása Start gombra start függvény
startButton.addEventListener("click", start);

    //Ha az input mezőben módosítás történjen rögtön megjelennek az input mezők
numberOfPlayers.addEventListener("input", renameThePlayers);

function renameThePlayers() {
        /*ha nem a nyilakat használják hanem beütik kézzel a számot 
        akkor se tudjanak az [1..10] intervallumon kívülre kerülni*/
    if(parseInt(numberOfPlayers.value)>10){
        numberOfPlayers.value=10;
    }
    if(parseInt(numberOfPlayers.value)<1){
        numberOfPlayers.value=1;
    }
        /*megnézzük, hogy jelenleg több játékos van-e beállítva mint input mező, 
        és adjunk hozzá újabb mezőket ha igen*/
    if(parseInt(numberOfPlayers.value) > playerInputs.length) {
        for (let i = playerInputs.length; i < parseInt(numberOfPlayers.value); i++) {
            let p = document.createElement("p");
            let input = document.createElement("input");
            input.type = "text";
            input.placeholder = `Játékos ${i+1} neve`;
            input.dataset.playerId = i;
            input.maxLength = 35;
            
            p.appendChild(input);
            playerInputs.push(p)
            playerRenameBlock.appendChild(p);
        }
    }   //ha kevesebb van beállítva akkor pedig töröljük a felesleget
    else if (parseInt(numberOfPlayers.value) < playerInputs.length) {
            for (let i = playerInputs.length; playerInputs.length > parseInt(numberOfPlayers.value); i--) {
                let a = playerInputs.pop();
                playerRenameBlock.removeChild(a);
            }
    }
}

    /*Vissza a főmenübe button eseménykezelője, 
    ilyenkor a beállítások megjelennek minden más eltünik, 
    az időzítőt leállítjuk, a fontosabb dolgokat töröljük*/
function backToTheMainMenu(){
    gamePlace.style.display="none"; 
    gameOverPlace.style.display = "none";
    settingsPlace.style.display="inline";
    focusElements = [];
    deck = [];
    actualDeckIndex = 0;
    points = [];
    time = 0;
    clearInterval(timer);
}

    /*Az időzítő eseménykezelője*/
function tick(){
    let date = new Date(0); 
    date.setSeconds(time);  
    let timeString = date.toTimeString().split(" ")[0].split(":");
    elapsedTime.innerHTML = `${timeString[1]}:${timeString[2]}`;
    time++;
}
//#endregion

//#region Main
    // Játék elindítása
function start(){
    // Nézzük meg egy játékos játsza-e vagy sem
    onlyOnePlayer = parseInt(numberOfPlayers.value) == 1;
    // Egyjátékos esetén mindig a 0. indexű játékos az aktuális játékos
    actualPlayer = (onlyOnePlayer ? 0 : null);             
    // Generáljunk le a táblát
    generate();    
    // Határozzuk meg milyen játékot játszunk
    let level = "normal";
    if (hardRadio.checked) {
        level = "hard";
    }

    // Tegyük le a kártyákat az asztalra új játékhoz
    newGame(level);   
    // Kiíratjuk a paklit.
    console.log(deck);
    // Nézzük meg hogy ha rögtön nem lenne benne set akkor pótoljuk, persze csak ha automatikus a +3 lapos pótlás
    autoFill();
    // Jelezzük, hogy mennyi kártya maradt a pakliban
    refreshCardNumberOnScreen();
    // indítsuk újra az időmérő időzítőt
    time = 0;
    timer = setInterval(tick,1000);
}

    // játéktér generálása
function generate(){
    settingsPlace.style.display = 'none';   // Rejtsük el a beállításokat
    gamePlace.style.display = 'inline';     // Jelenítsük meg a játékteret
    playersPlace.innerHTML = "";            // Töröljük a korábban beleírt játékosookat

    // Játékosok gombjait és pontjaiknakt megjelenítőket generálunk
    let players = document.createElement('div');
    points =  [];
    playersButton = [];
    for(let i = 1; i<=parseInt(numberOfPlayers.value); i++){
        let p = document.createElement('p');
        let but = document.createElement('button');
        let name = "";
        // a playerInputs p-ket tartalmaz és a p-k tartalmazzák az input mezőt
        if (playerInputs[i - 1].childNodes[0].value == undefined || playerInputs[i - 1].childNodes[0].value.trim() == ""){
             name = `Játékos ${i}` ;
        }else{
             name = playerInputs[i - 1].childNodes[0].value.trim();
        }
        but.innerHTML = name;
        but.dataset.id = i-1;
        /* 
        inGame része a gomboknak azt tartalmazza hogy játékban-van  
        Erre azért van szükség hogy mikor rosszul tippel egy játékos le tudjuk tiltani
        Nem elég a disable érték módosítása mert ezt akkor is megtesszük amikor játékban van játékos 
            pusztán le szeretnénk tiltani a használatukat mikor valamelyik társuk tippel (vagy ő maga tippel)
            ezzel elkerülve hogy átfedésbe lefussanak a gombokhoz kötött eseménykezelők
        */
        but.dataset.inGame = true;
        playersButton.push(but);
        // gombokhoz külön eseménykezelőt rendelünk ha csak 1 játékos van és ha több
        if(!onlyOnePlayer){
            but.addEventListener('click',addActPlayer);
        }else{
            but.addEventListener('click',()=>{alert("Egy játékos esetén nem kell külön megnyomni a gombot, automatikusan te leszel az aktív játékos")});
        }
        
        
        let label = document.createElement('span');
        label.innerHTML = "  Pontjai: ";
        
        let point = document.createElement('span');
        point.innerHTML = '0';
        points.push(point);

        
        p.appendChild(but);
        p.appendChild(label);
        p.appendChild(point);

        players.appendChild(p);
    }
    playersPlace.appendChild(players);

    // Plussz gombokat is generálunk
    buttonsPlace.innerHTML = "";
    let backBut = document.createElement('button');
    backBut.innerHTML = "Vissza a menübe";
    backBut.addEventListener('click',backToTheMainMenu);

    buttonsPlace.appendChild(backBut);

    // Alapértelmezetten úgy vesszük, hogy verseny mód van beállítva, és ha nem akkor módosítjuk amiket kell
    needThreeCardAuto = true;
    if(practiceRadio.checked){
        /* Van-e set a pályán kérdésre úgy ad választ, 
                hogy lefuttatjuk a setkeresőt és ha null-al tért vissza akkor nincs set, 
                hisz ha lenne visszatért volna azzal */
        if(haveSet.checked){
            let existSet = document.createElement('button');
            existSet.innerHTML = "Van-e Set?";
            existSet.addEventListener('click',()=>{
            let text ="";
                if(searchASet()!=null){
                    text = "Van Set a pályán!";
               }else{
                    text = "Nincs Set a pályán!";
               }
               alert(text);
            });
            buttonsPlace.appendChild(existSet);
        }
        /* A mutass egy set kérdésre úgy ad választ
            hogy lefuttatjuk a setKeresőt, és 2mp-ig módosítjuk az általa visszaadott értékek stílusát.
            Amennyiben nem található set akkor jelezzük egy alert-ben */
        if(showSet.checked){
            let giveMeASet = document.createElement('button');
            giveMeASet.innerHTML = "Mutass egy SET-et!";
            giveMeASet.addEventListener('click',()=>{
                let set = searchASet();
                if(set == null){
                    alert("Nincs set a pályán");
                }else{
                    set.forEach(elem => {
                       elem.classList.add("highlight");
                    });
                    setTimeout(()=>{
                        set.forEach(elem => {
                        elem.classList.remove("highlight");
                        });
                    },2000)
                }

            });
            buttonsPlace.appendChild(giveMeASet);
        }
        /* Ha külön gombra szeretné a +3 lapos kiegészítést akkor hamisra állítjuk az ezt figyelő változót 
            és külön gombhoz rendeljük a fg-t */
        if(needPlusButtonForFilling.checked){
            needThreeCardAuto = false;
            let ButForFIlling = document.createElement("button");
            ButForFIlling.innerHTML = "3 Lapos kiegészítés";
            ButForFIlling.addEventListener('click',()=>{
                addThreeMoreImg();
            });
            buttonsPlace.appendChild(ButForFIlling);
        }
    }
}

    // Feltöltjük a táblát kártyákkal
function newGame(level) {
    newDeck(level);         // Hozzunk létre egy új paklit, adott szintnek megfelelően
    table.innerHTML = "";   //töröljük az előző táblát
    actualDeckIndex = 0;    // Kezdjük az elejéről
    for (let i = 0; i < 3; i++) {
        let row = document.createElement("tr");
        for (let j = 0; j < 4; j++) {
            let col = document.createElement("td");
            let img = document.createElement("img");
            let card = deck[actualDeckIndex++]; // Veszünk egy új lapot a pakliból
            img.src = giveCardFileName(card);   // Lekérjük a fájl nevét
            col.appendChild(img);
            col.dataset.type = card.type;
            col.dataset.color = card.color;
            col.dataset.count = card.count;
            col.dataset.content = card.content;
            col.dataset.origin = "original";

            row.appendChild(col);
        }
        table.appendChild(row);
    }

    tablePlace.appendChild(table);
}

    // Egy Játékos körének vége
function check() {
    // Ellenőrzés, hogy a kijelölt elemek set-e vagy sem
    if (focusElements.length ==3  && isSet(focusElements)) {
        console.log("It is a set!");                    // Jelezzük egyértelműen, hogy set volt-e vagy sem.
        points[actualPlayer].innerHTML = `${parseInt(points[actualPlayer].innerHTML) + 1}`;     // növrkedjen a játékos pontja 1-es, points-tömb span-okat tárol
        for(let pb of playersButton){
            pb.disabled = false;                        // Minden gombot ujra elérhetővé teszünk
            pb.dataset.inGame = true;                   // Minden játékos újra visszakerül a játékba
        }   
        for (let icon of focusElements) {
            icon.classList.remove("focus");             // Töröljük a kijelölt elemek stílusosztályát
            let img = icon.querySelector("img"); 
            /* Megnézzük, 
            hogy ha még van kártya a pakliban,és az adott kártya nem a plussz lapok közül való volt*/
            if (deck.length > actualDeckIndex && icon.dataset.origin == "original") { 
                let card = deck[actualDeckIndex++];     // Vegyünk egy új lapot a pakliból
                img.src = giveCardFileName(card);       // Lekérjük a fájl nevét
                icon.dataset.type = card.type;
                icon.dataset.color = card.color;
                icon.dataset.count = card.count;
                icon.dataset.content = card.content;    
            } else {
                //Ellenkező esetben csak töröljük az adott kártyát
                icon.removeChild(img);
                icon.innerHTML = "";
            }
        }
        autoFill();                   // Ha nincs set akkor +3 lapot tegyünk le, amennyiben automatizálva van
        refreshCardNumberOnScreen();  // Frissítsük a kijelzőn a hátralévő lapok számát

        //amennyiben már nem található set, és elfogyott a pakliban a kártya akkor vége a játéknak
        if(searchASet() == null && actualDeckIndex >= deck.length){
            gameOver();
        }

    } else {
        console.log("It is not a set!");        // Egyértelműen jelezzük, hogy nem volt set;
        for(elem of focusElements){
            elem.classList.remove("focus");     // Törüljük a kijelölt elemek stílusát
        }
        // A játékos pontját csökkentsük eggyel, de csak ha így nem fog minuszba csökkeni
        let tmp = parseInt(points[actualPlayer].innerHTML); 
        if(tmp > 0){
            points[actualPlayer].innerHTML = `${tmp - 1}`; 
        }
        // Tiltsuk le a játékost, a gombját is
        playersButton[actualPlayer].disabled = true;
        playersButton[actualPlayer].dataset.inGame = false;
        // Nézzük meg hogy van-e még játékban lévő játékos
        let allPLayerOutOfGame = true;
        for(let i = 0; allPLayerOutOfGame && i< playersButton.length; i++){
            allPLayerOutOfGame = allPLayerOutOfGame && (playersButton[i].dataset.inGame == "false");
        }
        // ha nincs akkor mindenkit tegyünk vissza, és engedélyezzük a gombjaikat
        if(allPLayerOutOfGame){
            for(let pb of playersButton){
                pb.disabled = false;
                pb.dataset.inGame = true;
            }   
        }
    }
    focusElements = [];                                 // Töröljük a kijelölt elemek listáját
    playersButton[actualPlayer].style.background = "";  // Tüntessük el az aktív játékost jelző stílust
    actualPlayer = (onlyOnePlayer ? 0 : null);          // Tegyük null-á az aktuális játékost kivéve ha 1 játékos van játékban, ekkor ő lesz az aktuális játékos
}

    // Játék vége
function gameOver(){
    clearInterval(timer);                               // Állítsuk le az időzítőt
    gamePlace.style.display = "none";                   // Tüntessük el a játékteret
    gameOverPlace.style.display="inline";               // Jelenítsük meg az eredményhírdető felületet
    gameOverPlace.innerHTML="";                         // Töröljük le az eredményhírdető felületet
    
    // Hozzuk létre a szükséges címsorokat
    let h2 = document.createElement("h2");
    h2.innerHTML="Játéknak vége! Gratulálunk!";
    let h3 = document.createElement("h3");
    h3.innerHTML ="Rangsorrend:";
    gameOverPlace.appendChild(h2);
    gameOverPlace.appendChild(h3);

    // Csináljuk meg a vissza a főmenübe gombot
    let backbut = document.createElement("button");
    backbut.innerHTML="Vissza a főmenübe";
    backbut.addEventListener('click',backToTheMainMenu);
    
    // Hozzunk létre egy olyan tömböt, ami lényegében játékosnév - pont párokat tartalmaz, objektumként
    let topLista = playersButton.map((elem, index) => ({name: elem.innerHTML, point: parseInt(points[index].innerHTML) }));
    // Rendezzük őket csökkenő sorrendbe pontok szerint, így kialakítva a sorrendet
    topLista.sort((a,b)=>b.point - a.point);
    // Jelenítsük meg a Ranglistát
    let list = document.createElement("ol");
    for(member of topLista){
        let li = document.createElement("li");
        li.innerHTML = `${member.name} ( ${member.point} )`;
        list.appendChild(li);
    }
    gameOverPlace.appendChild(list);

    // Írjuk ki meddig tartott a játék
    let timeP = document.createElement("p");
    timeP.innerHTML = `Játékidő: ${elapsedTime.innerHTML}`;
    gameOverPlace.appendChild(timeP);

    //Hozzunk létre egy új játék lehetőséget mely nem változtat a beállításokon
    let againP = document.createElement("p");
    let againBut = document.createElement("button");
    let againSpan = document.createElement("span");
    againSpan.innerHTML = "Új játék, ugyanezekkel a beállításokkal és játékosokkal: ";
    againBut.innerHTML = "Új játék";
    againBut.addEventListener('click',()=>{
        gameOverPlace.style.display="none";
        gamePlace.style.display="inline";
        start();
    });
    againP.appendChild(againSpan);    
    againP.appendChild(againBut);     

    gameOverPlace.appendChild(againP);
    gameOverPlace.appendChild(backbut);
}
//#endregion

//#region Deck functions
    // Új pakli létrehozása
function newDeck(level) {
    // Hozzunk létre Normal játéknak megfelelő paklit. 
    deck = [];
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
            for (let k = 0; k < 3; k++) {
                deck.push({
                    type: Type[i],
                    color: Color[j],
                    count: Count[k],
                    content: Content[0]
                });
            }
        }
    }
    // Ha nehéz fokozaton játszunk, vegyük bele a maradék lapokat
    if (level == "hard") { 
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                for (let k = 0; k < 3; k++) {
                    for (let l = 1; l < 3; l++) {   //itt már 1-ről indítjuk mert a 0-as indexüek már benne vannak
                        deck.push({
                            type: Type[i],
                            color: Color[j],
                            count: Count[k],
                            content: Content[l]
                        });
                    }
                }
            }
        }
    }
    shuffle(deck);  // Majd keverjük össze a paklit
}

    // A letöltött svg képek címét kaphatjuk itt vissza
function giveCardFileName(card) {
    let name = "icons/";
    name += card.count;
    switch (card.content) {
        case "dense":
            name += 'S';
            break;
        case "stripey":
            name += 'H';
            break;
        case "empty":
            name += 'O';
            break;
    }
    switch (card.color) {
        case "red":
            name += 'r';
            break;
        case "green":
            name += 'g';
            break;
        case "purple":
            name += 'p';
            break;
    }
    switch (card.type) {
        case "oval":
            name += 'P';
            break;
        case "vawey":
            name += 'S';
            break;
        case "deltoid":
            name += 'D';
            break;
    }
    name += ".svg";
    return name;
}

    // Nem találtam beépített tömbkeverő algoritmust mint a php-ban
function shuffle(array) {
    for (let index in array) {
        let ind2 = (Math.floor(Math.random() * array.length)) % array.length;
        let act = array[index];
        array[index] = array[ind2];
        array[ind2] = act;
    }
}
//#endregion

//#region SearchASet
    //Set kereső
function searchASet(){
    let table = tablePlace.querySelector("table");

    //Gyűjtsük össze a td-ket amik tartalmaznak lapokat
    let icons = [];
    for( let row of table.childNodes){
        for(let col of row.childNodes){
            if(col.childNodes.length != 0){
                icons.push(col);
            }
        }
    }
    // Végignézzük az összes kombinációban őket, és ha bárhol lesz SET akkor azt visszaadjuk rögtön
    for(let i = 0; i< icons.length; i++){
        for(let j = i+1; j<icons.length; j++){
            for(let k = j+1; k<icons.length; k++){
                let maybeSet = [icons[i],icons[j],icons[k]];
                if(isSet(maybeSet)){
                    return maybeSet;
                }
            }
        }
    }
    // Ha sehol sem találtunk SET-et akkor null-t adaunk vissza erre lehet majd tesztelnni, a Van-e SET? kérdésnél
    return null;   
}

    // Set definíciója szerint megvizsgáljuk minden tulajdonságnál, hogy ott vagy megegyezik mind vagy mint különbözik
function isSet(arr){
    let typedata = [];
    let colordata = [];
    let countdata = [];
    let contentdata = [];
    let index = 0;
    for (let icon of arr) {
        typedata[index] = icon.dataset.type;
        colordata[index] = icon.dataset.color;
        countdata[index] = icon.dataset.count;
        contentdata[index] = icon.dataset.content;
        index++;
    }
    return sameOrTotalDiff(typedata) && sameOrTotalDiff(colordata) && sameOrTotalDiff(countdata) && sameOrTotalDiff(contentdata);

}

    //  Megnézzük, hogy egy halmaz elemei között vagy mind megegyezik vagy mind különbözik-e
function sameOrTotalDiff(arr) {
    let same = true;
    let diff = true;

    for (let i = 0; i < arr.length && (same || diff); i++) {
        if (i != arr.length - 1) {
            same = same && (arr[i] == arr[i + 1]);
        }
        for (let j = i + 1; j < arr.length && diff; j++) {
            diff = diff && ( arr[i] != arr[j] );
        }
    }
    return same || diff;
}
//#endregion

//#region  more Three img
    // Hozzáadunk még egy sort amiben megjelenítjuk a következő 3 képet a pakliből. 
function addThreeMoreImg(){
    let row = document.createElement("tr");
    for(let i = 0; i<3 && deck.length > actualDeckIndex; i++){
            let col = document.createElement("td");
            let img = document.createElement("img");
            let card = deck[actualDeckIndex++];
            img.src = giveCardFileName(card);
            col.appendChild(img);
            col.dataset.type = card.type;
            col.dataset.color = card.color;
            col.dataset.count = card.count;
            col.dataset.content = card.content;
            /*mivel ha ezek közül választunk ki set-et akkor itt nem kell pótolni, 
              Így felveszünk egy plussz adatot, hogy tudjunk rá tesztelni a check-ben
            */
            col.dataset.origin = "plus";            

            row.appendChild(col);
        }
    tablePlace.querySelector("table").appendChild(row);
    refreshCardNumberOnScreen();    // Frissítsük a bentmaradó kártyák számát
}

    // Automatizálása a lapok hozzáadásának
function autoFill(){
    if(needThreeCardAuto){ // Csak akkor tegyük meg ha kell automatizálni
        while(searchASet() == null && actualDeckIndex < deck.length){  // ha nincs set az asztalon és még tudunk pakolni, tegyünk
            addThreeMoreImg();
        }
    }
}
//#endregion

//#region  Card Choosing
    // Órai delegal copy paste
function delegal(szulo, gyerek, mikor, mit) {
    function esemenyKezelo(esemeny) {
        let esemenyCelja = esemeny.target;
        let esemenyKezeloje = this;
        let legkozelebbiKeresettElem = esemenyCelja.closest(gyerek);

        if (esemenyKezeloje.contains(legkozelebbiKeresettElem)) {
            mit(esemeny, legkozelebbiKeresettElem);
        }
    }
    szulo.addEventListener(mikor, esemenyKezelo);
}

    /* 
    * Ha nincs aktuális játékos aki mondjon akkor nem cisnálunk semmit,
    * Ha van aktív játékos akkor, minden kattintott elemnél megnézzük benne van-e már kijelölt elemek között, 
    *    ha nem tegyük bele, ha igen vegyük ki onnan
    *    és a stílusukkal is ugyanezt hajtsuk végre
    *
    * Amennyiben 3 kijelölt elemünk lesz, futtassuk egy ellenőrzést. (check())
    */
function setFocus(esemeny, elem) {
    if(actualPlayer != null){
        if (!elem.classList.contains("focus")) {
            elem.classList.add("focus");
            focusElements.push(elem);
            if (focusElements.length == 3) {
                check();
            }
        }else{
            elem.classList.remove("focus");
            focusElements = focusElements.filter((tmp)=>tmp != elem );
        }
    }
}

    // A játékosok gombjaihoz van hozzárendelve, beállítja az aktuális játékost
function addActPlayer(event){
    timeText.style.display = 'inline';                      // Itt fog megjelenni a visszaszámláló
    actualPlayer = event.target.dataset.id;                 // Beállítjuk az aktuális játékos indexét
    playersButton[actualPlayer].style.background= "cyan";   // Jelezzük az oldalon, hogy ki az aktuális játékos
    
    // Tiltsuk le az összes gombot, ezzel elkerülve hogy több időzítő induljon el párhuzamosan
    for(but of playersButton){
        but.disabled = true;
    }

    // Beállítunk egy időzítot mely visszafelé fog számolni 10-től
    let interval = setInterval(()=>{
        /*
        Csökkentsük a számlálót, amíg el nem érjük a 0-át 
        vagy ameddig a játékosunk kijelölése meg nem szűnik - ergo ki mkijelölte a 3 lapot amit gondolt 
        */
        let t = parseInt(timeScreen.innerHTML);
        if(t > 0 && actualPlayer != null){
            timeScreen.innerHTML = `${--t}`;
        }else{

            /* Ha az actualPlayer nem null akkor azt jelenti hogy az időzítő járt le,
            ebben az esetben úgy kell kezelnünk, hogy hibásan tippelt
            Lefuttatjuk a check-et, mivel a focusElements nem fog 3 elemet tartlamzni, (hisz akkor ugye nem lennénk itt) 
                így úgy fogja kezelni a check hogy nem sikerült jól tippelnie */
            if(actualPlayer != null){
                playersButton[actualPlayer].style.background= "";
                playersButton[actualPlayer].dataset.inGame = false;
                check();
                actualPlayer = (onlyOnePlayer ? 0 : null);

            }
            timeScreen.innerHTML = 10;              // Visszaállítjuk az időzítot 10re
            timeText.style.display = 'none';        // És eltüntetjük a sávot ami jelzi
            
            // Amelyik játékos játékban van ott újra megengedjük a gomb használatát
            for(let but of playersButton){          
                if(but.dataset.inGame == "true"){
                    but.disabled = false;
                }
            }
            // Állítsuk le az időzítőt
            clearInterval(interval);
        }
    },1000);
    
}

    // Jelezzük mennyi kártya maradt a pakliban.
function refreshCardNumberOnScreen(){
    numberOfCards.innerHTML = deck.length - actualDeckIndex;
}
//#endregion

//#region Actually Code
    // Alapértelmezetten nincs input eseméyne az <input>-nak így egyszer lefuttatjuk rögtön
renameThePlayers();
    // Nem külön a td-kre kötünk eseményt hanem csak a táblázatra, így optimálisabb
delegal(table, 'td', 'click', setFocus);
//#endregion

//2020.11.22