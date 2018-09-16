/*
    Note:
        - Add a "click to start" initial screen
        - Add more obstacles
        - Add a high score
*/

// wrapping everything in (function() {... everything ...})(); prevents variables from being accessed in other scripts
(function() {

var myGameArea;
var myGamePiece;
var myObstacle;

// start the game after the page has loaded
document.addEventListener('DOMContentLoaded', startGame() );


function startGame() {
    createComponents();
    myGameArea.setup();
    // myGameArea.start();
    myGameArea.waitToStart();
}

function GameArea() {
    this.canvas = document.createElement("canvas");

    var handler3 = function(e){myGameArea.start()};

    this.waitToStart = function() {
        myGameArea.canvas.addEventListener("click", handler3);
    }

    this.test = function() {
        console.log("click happened");
    }

    this.setup = function() {
        this.canvas.width = 480;
        this.canvas.height = 270;

        this.context = this.canvas.getContext("2d");

        this.canvas.style.margin = "20px";
        this.canvas.style.border = "1px solid rgb(100,100,100)";
        this.canvas.style.backgroundColor = "rgb(230, 230, 230)";

        this.frameNo = 0;

        window.addEventListener('keydown', function (e) {
            e.preventDefault();
            myGameArea.keys = (myGameArea.keys || []);
            myGameArea.keys[e.keyCode] = (e.type == "keydown");
        })
        window.addEventListener('keyup', function (e) {
            myGameArea.keys[e.keyCode] = (e.type == "keydown");
        })

        document.currentScript.parentElement.insertBefore(this.canvas, document.currentScript);
    }

    this.start = function() {
        this.canvas.removeEventListener("click", handler3);


        this.interval = setInterval(updateGameArea, 20);
    }

    this.clear = function() {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    this.stop = function() {
        clearInterval(this.interval);
    }
}

function component(width, height, color, x, y, scale, type) {
    this.type = type;
    this.width = width;
    this.height = height;
    this.color = color;
    this.scale = scale;
    this.speedX = 0;
    this.speedY = 0;    
    this.x = x;
    this.y = y;
    this.text = "Error";
    if(this.type == "obstacle") {
        randomStart(this);
    }
    this.update = function() {
        ctx = myGameArea.context;
        if(this.type!="text")
            ctx.fillStyle = this.color;
            ctx.fillRect(this.x, this.y, this.width, this.height);
        if(this.type=="text") {
            ctx.font = this.width + " " + this.height;
            ctx.fillStyle = color;
            ctx.fillText(this.text, this.x, this.y)
        }
    }
    this.newPos = function() {
        this.x += this.speedX;
        this.y += this.speedY;
        if(outOfBounds(this))
            randomStart(this);
    }
    this.crashWith = function(otherobj) {
        var myleft = this.x;
        var myright = this.x + (this.width);
        var mytop = this.y;
        var mybottom = this.y + (this.height);
        var otherleft = otherobj.x;
        var otherright = otherobj.x + (otherobj.width);
        var othertop = otherobj.y;
        var otherbottom = otherobj.y + (otherobj.height);
        var crash = true;
        if ((mybottom < othertop) || (mytop > otherbottom) || (myright < otherleft) || (myleft > otherright)) {
            crash = false;
        }
        return crash;
    }
}

function updateGameArea() {
    if (myGamePiece.crashWith(myObstacle)) {
        myGameArea.stop();
        /*document.getElementById("myfilter").style.display = "block"; 
        document.getElementById("myrestartbutton").style.display = "block"; 
        return; */
    } else {
        myGameArea.clear();
        if(myGameArea.keys) {
            if(myGameArea.keys[37] && myGamePiece.x > 0)
                myGamePiece.x += -5;
            if(myGameArea.keys[39] && myGamePiece.x < myGameArea.canvas.width-myGamePiece.width)
                myGamePiece.x += 5;
            if(myGameArea.keys[38] && myGamePiece.y > 0)
                myGamePiece.y += -5;
            if(myGameArea.keys[40] && myGamePiece.y < myGameArea.canvas.height-myGamePiece.height)
                myGamePiece.y += +5;
        }
        myGamePiece.x += myGamePiece.speedX;
        myGamePiece.y += myGamePiece.speedY;    
        myGamePiece.update();
        myObstacle.newPos();
        myObstacle.update();
        myScore.text = "Score: " + myGameArea.frameNo;
        myScore.update();
    }

    myGameArea.frameNo += 1;

    // change player color every 200 frames
    if(myGameArea.frameNo%200 == 0)
        myGamePiece.color = randomColor();
}

function moveup() {
    myGamePiece.speedY = -1; 
}

function movedown() {
    myGamePiece.speedY = 1; 
}

function moveleft() {
    myGamePiece.speedX = -1; 
}

function moveright() {
    myGamePiece.speedX = 1; 
}

function clearmove() {
    myGamePiece.speedX = 0; 
    myGamePiece.speedY = 0; 
}

function randomColor() {
    var r = Math.floor(Math.random()*256);
    var g = Math.floor(Math.random()*256);
    var b = Math.floor(Math.random()*256);
    return "rgb("+r+","+g+","+b+")";
}

// puts an object at a random location (off canvas), and moves it accross the canvas
function randomStart(obj) {
    var side = Math.floor(Math.random()*4); // which side the object will start on
    var x=200; 
    var y=100;
    var speedX=0;
    var speedY=0;
    switch(side) {
        case 0: // left
            x = 0; 
            y = Math.floor(Math.random()*270/*myGameArea.canvas.height*/);
            speedX = 1;
            speedY = -1 + Math.floor(Math.random()*3);  // sets to -1, 0, or 1
            break;
        case 1: 
            x = Math.floor(Math.random()*480/*myGameArea.canvas.width*/); 
            y = 0;
            speedX = -1 + Math.floor(Math.random()*3);  // sets to +-1
            speedY = 1;
            break;
        case 2: 
            x = 480/*myGameArea.width*/;
            y = Math.floor(Math.random()*270/*myGameArea.canvas.height*/);
            speedX = -1;
            speedY = -1 + Math.floor(Math.random()*3);  // sets to -1, 0, or 1
            break;
        case 3:
            x = Math.floor(Math.random()*480/*myGameArea.canvas.width*/); 
            y = 270/*myGameArea.height*/;
            speedX = -1 + Math.floor(Math.random()*3);  // sets to -1, 0, or 1
            speedY = -1;
            break;
        default:
            x=50;
            y=50;
            speedX=1;
            speedY=1;
    }   // end switch
    obj.x = x;
    obj.y = y;
    obj.speedX = speedX*obj.scale;
    obj.speedY = speedY*obj.scale;
}   // end fn

function outOfBounds(obj) {
    x = obj.x;
    y = obj.y;
    width = obj.width;
    height = obj.height;
    if(x+width < 0)
        return true;
    if(y+height < 0)
        return true;
    if(x>481)
        return true;
    if(y>271)
        return true;
    return false;
}

function createComponents(){
    myGamePiece = new component(30, 30, randomColor(), 240, 135, 5, "player");
    myObstacle  = new component(20, 20, "blue", 100, 100, 5, "obstacle");  
    myScore = new component("20px", "Consolas", "black", 350, 40, 1, "text");  
    myGameArea = new GameArea();
}

// document.getElementById("gameButton").onClick = startGame();


})();