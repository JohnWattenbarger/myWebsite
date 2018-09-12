
/*
    Note: 
        - right click (anywhere on the screen) switches to demo mode
        - switch the text in changeColors() function at the begginning to switch to different color schemes
        - keeps track of the high score on this machine (to reset put resetHighScore() right below changeColors() and the game)
        - click anywhere on the game to start
        - use space bar to jump

    Future updates:
        - Possibly make right click only work in the game, and not show a menu
        - New high scores currently print over the old high score at the end of the game
        - clicking the canvas/game highlights words below the canvas/game
        - Add a menu to select color schemes
*/

var myGamePiece2;
var myObstacles = [];
var score = 0;
var myCanvas;
var myGameArea2 = new GameArea();
var timesRun = 0;
var highScore;
var myColors = new ColorChoices();
// used for demo mode
var currentY = 0;
var nextY = 0;
var updateY;
var demoMode = false;

    // used to change the color scheme
    changeColors("normal");

    // start the game after the page has loaded
    document.addEventListener('DOMContentLoaded', startGame() );

function startGame() {
    if(timesRun == 0) {
        myGameArea2.setup();
        myGameArea2.waitForStart();
    }
    else {
        myGameArea2.reset();
        myGameArea2.waitForStart();
    }
}


function GameArea() {
    this.canvas = document.createElement("canvas");
    var handler = function(event){myGameArea2.start();}
    var handler2 = function(event){myGameArea2.reset();}

    this.setup = function(){
        this.canvas.setAttribute("id", "game2");
        this.context = this.canvas.getContext("2d");

        this.canvas.style.backgroundColor = myColors.canvasBackground;
        this.canvas.style.border = "1px solid rgb(100, 100, 100)";
        this.canvas.style.margin = "20px";

        this.canvas.width = 480;
        this.canvas.height = 270;

        this.frameNo = 0;

        getHighScore();

        window.addEventListener('keydown', function (e) {
            myGameArea2.key = e.keyCode;
        })
        window.addEventListener('keyup', function (e) {
            myGameArea2.key = false;
        })
        // used for Demo Mode (switches on right-clicks)
        window.addEventListener("contextmenu", function (e) {
            if(demoMode)
                demoMode = false;
            else
                demoMode = true;
        })

        document.body.insertBefore(this.canvas, document.currentScript.nextSibling);
    
        createComponents();
}

    // when mouse is clicked, run this.start()
    this.waitForStart = function(){
        waitingMessage();
        this.canvas.addEventListener("click", handler);
    }

    this.start = function(){
        this.canvas.removeEventListener("click", handler);
        this.interval = setInterval(updateGameArea, 20);
    };

    this.clear = function(){
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    };

    this.stop = function(){
        timesRun += 1;
        endGameMessage();
        clearInterval(this.interval);
        updateHighScore();
        displayHighScore();
        this.canvas.addEventListener("click", handler2);
    }

    this.reset = function(){
        this.canvas.removeEventListener("click", handler2);
        this.frameNo = 0;
        myObstacles = [];
        score = 0;
        this.clear();
        createComponents();
        this.waitForStart();
    }
}

// things drawn on the canvas
function component(width, height, color, x, y) {
    this.width = width;
    this.height = height;
    this.x = x;
    this.y = y; 
    this.speedX = 0;
    this.speedY = 0;
    this.gravitySpeed = 2;
    this.jumpTimeRemaining = 0;

    // redraws the component
    this.update = function(){
        context = myGameArea2.context;
        context.fillStyle = color;
        context.fillRect(this.x, this.y, this.width, this.height);
    }

    this.newPosition = function() {
        this.x += this.speedX;
        this.y += this.speedY;

        // add gravity
        if(this.jumpTimeRemaining == 0)
            this.y += this.gravitySpeed;
    }

    this.crashWith = function(otherobj) {
        // this object's coordinates
        var myleft = this.x;
        var myright = this.x + (this.width);
        var mytop = this.y;
        var mybottom = this.y + (this.height);

        // other object's coordinates
        var otherleft = otherobj.x;
        var otherright = otherobj.x + (otherobj.width);
        var othertop = otherobj.y;
        var otherbottom = otherobj.y + (otherobj.height);

        // check if the 2 objects overlap
        var crash = true;
        if ((mybottom < othertop) ||
               (mytop > otherbottom) ||
               (myright < otherleft) ||
               (myleft > otherright)) {
           crash = false;
        }
        return crash;
    }

    // allows the user to move up for a period of time
    this.jump = function() {
        this.jumpTimeRemaining = 12;
        this.speedY = -3;
    }
}

function createComponents() {
    myGamePiece2 = new component(30, 30, myColors.pieceColor, 100, 120);
    
}

function updateGameArea() {
    var x, height, gap, minHeight, maxHeight, minGap, maxGap;

    // check if the main character crashed with any obstacles
    if(crashed())
        return;
    
    myGameArea2.clear();
    myGameArea2.frameNo += 1;

    // creates 2 new walls with a gap in between them every 150 frames
    createWalls();

    // update score
    if(myGameArea2.frameNo > 200 && (myGameArea2.frameNo-50) % 150 == 0)
        score++;

    // move every obstacle one to the left each frame
    moveWalls();
    

    // keeps the main character in place
    if(myGamePiece2.jumpTimeRemaining==0)
        myGamePiece2.speedY = 0; 


    // used for demo mode
    if(updateY == myGameArea2.frameNo)
        currentY = nextY;
    if(demoMode) {
        if(needToJump())
            myGamePiece2.jump();
    }

    // key 32 is the space bar
    if(myGameArea2.key == 32 && myGamePiece2.y > 0)
        myGamePiece2.jump();
    myGamePiece2.gravity = 0;

    // decrement the jumpTime every frame
    if(myGamePiece2.jumpTimeRemaining != 0)
        myGamePiece2.jumpTimeRemaining--;

    myGamePiece2.newPosition();
    myGamePiece2.update();

    displayHighScore();
    displayScore();
}

// check if the gamepiece hit a wall or the floor
function crashed() {
    for (i = 0; i < myObstacles.length; i += 1) {
        if (myGamePiece2.crashWith(myObstacles[i])) {
            myGameArea2.stop();
            return true;
        }
    }

    if(myGamePiece2.y + myGamePiece2.height > myGameArea2.canvas.height) {
        myGameArea2.stop();
        return true;
    }

    return false;
}

// creates 2 new walls with a gap in between them every 150 frames
function createWalls() {
    if(myGameArea2.frameNo % 150 == 0) {
        wallColor = myColors.obstacleColor;
        x = myGameArea2.canvas.width;
        minHeight = 20;
        maxHeight = 170;
        height = Math.floor(Math.random()*(maxHeight - minHeight + 1) + minHeight);
        gap = 100
        myObstacles.push(new component(50, height, wallColor, x, 0));
        myObstacles.push(new component(50, x - height - gap, wallColor, x, height + gap));

        // used for demo mode
        updateY = myGameArea2.frameNo + 62;
        nextY = (height + gap - 35);
        if(myGameArea2.frameNo < 200)
            currentY = nextY;
    }
}

// move all walls to the left
function moveWalls() {
    for(i=0; i<myObstacles.length; i += 1) {
        myObstacles[i].x += -2;
        myObstacles[i].update();
    }
}

// display the current score
function displayScore() {
    myGameArea2.context.font = "20px" + " " + "Consolas";
    myGameArea2.context.fillStyle = myColors.textColor;
    myGameArea2.context.fillText("Score: " + score, 350, 40)
}

// display "Game Over"
function endGameMessage() {
    myGameArea2.context.font = "40px" + " " + "Consolas";
    myGameArea2.context.fillStyle = myColors.textColor;
    myGameArea2.context.fillText("Game Over", 130, 140)
}

function waitingMessage() {
    myGameArea2.context.font = "30px" + " " + "Consolas";
    myGameArea2.context.fillStyle = myColors.textColor;
    myGameArea2.context.fillText("Click to start", 130, 140)
}

function randomColor() {
    var r = Math.floor(Math.random()*256);
    var g = Math.floor(Math.random()*256);
    var b = Math.floor(Math.random()*256);
    return "rgb("+r+","+g+","+b+")";
}


function ColorChoices() {
        this.canvasBackground = "rgb(200, 250, 255)";
        this.pieceColor = "rgb(230, 230, 65)";
        this.obstacleColor = "rgb(55, 180, 50)";
}

function changeColors(text) {
    if(text == "normal") {
        myColors.canvasBackground = "rgb(200, 250, 255)";
        myColors.pieceColor = "rgb(230, 230, 65)";
        myColors.obstacleColor = "rgb(55, 180, 50)";
        myColors.textColor = "rgb(0, 0, 0)";
    }

    if(text == "watermellon") {
        myColors.canvasBackground = "rgb(220, 40, 60)";
        myColors.pieceColor = "rgb(0, 0, 0)";
        myColors.obstacleColor = "rgb(55, 180, 50)";
        myColors.textColor = "rgb(0, 0, 0)";
    }

    if(text == "random") {
        myColors.canvasBackground = randomColor();
        myColors.pieceColor = randomColor();
        myColors.obstacleColor = randomColor();
        myColors.textColor = randomColor();
    }

    if(text == "inverse") {
        myColors.canvasBackground = "rgb(55, 5, 0)";
        myColors.pieceColor = "rgb(25, 25, 190)";
        myColors.obstacleColor = "rgb(200, 75, 205)";
        myColors.textColor = "rgb(255, 255, 255)";
    }
}

function getHighScore() {
    highScore = localStorage.getItem('HighScore');
    if(highScore == null)
        highScore = 0;
}

function displayHighScore() {
    myGameArea2.context.font = "20px" + " " + "Consolas";
    myGameArea2.context.fillStyle = myColors.textColor;
    myGameArea2.context.fillText("High Score: " + highScore, 300, 80)
}

function updateHighScore() {
    if(highScore < score)
        highScore = score;
    localStorage.setItem('HighScore', highScore);
}

function resetHighScore() {
    localStorage.setItem('HighScore', 0);
}

// Used for demo mode
function needToJump(){
    var atJumpY = false;

    // if the game piece gets close to the bottom, jump
    if(myGameArea2.frameNo < 150){
        if(myGamePiece2.y > (myGameArea2.canvas.height - 60))
            return true;
        else
            return false;
    }

    if(myGamePiece2.y > currentY - 5)
        atJumpY = true;

    return atJumpY;
}