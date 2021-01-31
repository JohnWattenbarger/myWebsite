
/*
    Note: 
        - click "~" key (anywhere on the screen) switches to demo mode
        - switch the text in changeColors() function at the begginning to switch to different color schemes
        - keeps track of the high score on this machine (to reset put resetHighScore() right below changeColors() and the game)
        - click anywhere on the game to start
        - use space bar to jump

    Future updates:
        - New high scores currently print over the old high score at the end of the game
        - Add a menu to select color schemes
*/

(function () {

    var myGamePiece;
    var myObstacles = [];
    var score = 0;
    var myCanvas;
    var myGameArea = new GameArea();
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
    document.addEventListener('DOMContentLoaded', startGame());

    function startGame() {
        if (timesRun == 0) {
            myGameArea.setup();
            myGameArea.waitForStart();
        }
        else {
            myGameArea.reset();
            myGameArea.waitForStart();
        }
    }


    function GameArea() {
        this.canvas = document.createElement("canvas");
        var handler = function (event) { myGameArea.start(); }
        var handler2 = function (event) { myGameArea.reset(); }

        this.setup = function () {
            // this.canvas.setAttribute("id", "game2");
            this.context = this.canvas.getContext("2d");

            this.canvas.style.backgroundColor = myColors.canvasBackground;
            this.canvas.style.border = "1px solid rgb(100, 100, 100)";
            this.canvas.style.margin = "20px";

            this.canvas.width = 480;
            this.canvas.height = 270;

            this.frameNo = 0;

            getHighScore();

            window.addEventListener('touchstart', function (e) {
                console.log('touch start');
                myGameArea.key = 32;
            })
            window.addEventListener('touchend', function (e) {
                console.log('touch end');
                myGameArea.key = false;
            })

            window.addEventListener('keydown', function (e) {
                myGameArea.key = e.keyCode;
            })
            window.addEventListener('keyup', function (e) {
                myGameArea.key = false;
            })
            // used for Demo Mode (switches on "~" presses)
            window.addEventListener("keydown", function (e) {
                if (e.keyCode == 192)
                    if (demoMode)
                        demoMode = false;
                    else
                        demoMode = true;
            })

            document.currentScript.parentElement.insertBefore(this.canvas, document.currentScript);

            createComponents();
        }

        // when mouse is clicked, run this.start()
        this.waitForStart = function () {
            waitingMessage();
            this.canvas.addEventListener("click", handler);
        }

        this.start = function () {
            this.canvas.removeEventListener("click", handler);
            this.interval = setInterval(updateGameArea, 20);
        };

        this.clear = function () {
            this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
        };

        this.stop = function () {
            timesRun += 1;
            endGameMessage();
            clearInterval(this.interval);
            updateHighScore();
            displayHighScore();
            this.canvas.addEventListener("click", handler2);
        }

        this.reset = function () {
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
        this.update = function () {
            context = myGameArea.context;
            context.fillStyle = color;
            context.fillRect(this.x, this.y, this.width, this.height);
        }

        this.newPosition = function () {
            this.x += this.speedX;
            this.y += this.speedY;

            // add gravity
            if (this.jumpTimeRemaining == 0)
                this.y += this.gravitySpeed;
        }

        this.crashWith = function (otherobj) {
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
        this.jump = function () {
            this.jumpTimeRemaining = 12;
            this.speedY = -3;
        }
    }

    function createComponents() {
        myGamePiece = new component(30, 30, myColors.pieceColor, 100, 120);

    }

    function updateGameArea() {
        var x, height, gap, minHeight, maxHeight, minGap, maxGap;

        // check if the main character crashed with any obstacles
        if (crashed())
            return;

        myGameArea.clear();
        myGameArea.frameNo += 1;

        // creates 2 new walls with a gap in between them every 150 frames
        createWalls();

        // update score
        if (myGameArea.frameNo > 200 && (myGameArea.frameNo - 50) % 150 == 0)
            score++;

        // move every obstacle one to the left each frame
        moveWalls();


        // keeps the main character in place
        if (myGamePiece.jumpTimeRemaining == 0)
            myGamePiece.speedY = 0;


        // used for demo mode
        if (updateY == myGameArea.frameNo)
            currentY = nextY;
        if (demoMode) {
            if (needToJump())
                myGamePiece.jump();
        }

        // key 32 is the space bar
        if (myGameArea.key == 32 && myGamePiece.y > 0)
            myGamePiece.jump();
        myGamePiece.gravity = 0;

        // decrement the jumpTime every frame
        if (myGamePiece.jumpTimeRemaining != 0)
            myGamePiece.jumpTimeRemaining--;

        myGamePiece.newPosition();
        myGamePiece.update();

        displayHighScore();
        displayScore();
    }

    // check if the gamepiece hit a wall or the floor
    function crashed() {
        for (i = 0; i < myObstacles.length; i += 1) {
            if (myGamePiece.crashWith(myObstacles[i])) {
                myGameArea.stop();
                return true;
            }
        }

        if (myGamePiece.y + myGamePiece.height > myGameArea.canvas.height) {
            myGameArea.stop();
            return true;
        }

        return false;
    }

    // creates 2 new walls with a gap in between them every 150 frames
    function createWalls() {
        if (myGameArea.frameNo % 150 == 0) {
            wallColor = myColors.obstacleColor;
            x = myGameArea.canvas.width;
            minHeight = 20;
            maxHeight = 170;
            height = Math.floor(Math.random() * (maxHeight - minHeight + 1) + minHeight);
            gap = 100
            myObstacles.push(new component(50, height, wallColor, x, 0));
            myObstacles.push(new component(50, x - height - gap, wallColor, x, height + gap));

            // used for demo mode
            updateY = myGameArea.frameNo + 62;
            nextY = (height + gap - 35);
            if (myGameArea.frameNo < 200)
                currentY = nextY;
        }
    }

    // move all walls to the left
    function moveWalls() {
        for (i = 0; i < myObstacles.length; i += 1) {
            myObstacles[i].x += -2;
            myObstacles[i].update();
        }
    }

    // display the current score
    function displayScore() {
        myGameArea.context.font = "20px" + " " + "Consolas";
        myGameArea.context.fillStyle = myColors.textColor;
        myGameArea.context.fillText("Score: " + score, 350, 40)
    }

    // display "Game Over"
    function endGameMessage() {
        myGameArea.context.font = "40px" + " " + "Consolas";
        myGameArea.context.fillStyle = myColors.textColor;
        myGameArea.context.fillText("Game Over", 130, 140)
    }

    function waitingMessage() {
        myGameArea.context.font = "30px" + " " + "Consolas";
        myGameArea.context.fillStyle = myColors.textColor;
        myGameArea.context.fillText("Click to start", 130, 140)
    }

    function randomColor() {
        var r = Math.floor(Math.random() * 256);
        var g = Math.floor(Math.random() * 256);
        var b = Math.floor(Math.random() * 256);
        return "rgb(" + r + "," + g + "," + b + ")";
    }

    function ColorChoices() {
        this.canvasBackground = "rgb(200, 250, 255)";
        this.pieceColor = "rgb(230, 230, 65)";
        this.obstacleColor = "rgb(55, 180, 50)";
    }

    function changeColors(text) {
        if (text == "normal") {
            myColors.canvasBackground = "rgb(200, 250, 255)";
            myColors.pieceColor = "rgb(230, 230, 65)";
            myColors.obstacleColor = "rgb(55, 180, 50)";
            myColors.textColor = "rgb(0, 0, 0)";
        }

        if (text == "watermellon") {
            myColors.canvasBackground = "rgb(220, 40, 60)";
            myColors.pieceColor = "rgb(0, 0, 0)";
            myColors.obstacleColor = "rgb(55, 180, 50)";
            myColors.textColor = "rgb(0, 0, 0)";
        }

        if (text == "random") {
            myColors.canvasBackground = randomColor();
            myColors.pieceColor = randomColor();
            myColors.obstacleColor = randomColor();
            myColors.textColor = randomColor();
        }

        if (text == "inverse") {
            myColors.canvasBackground = "rgb(55, 5, 0)";
            myColors.pieceColor = "rgb(25, 25, 190)";
            myColors.obstacleColor = "rgb(200, 75, 205)";
            myColors.textColor = "rgb(255, 255, 255)";
        }
    }

    function getHighScore() {
        highScore = localStorage.getItem('HighScore');
        if (highScore == null)
            highScore = 0;
    }

    function displayHighScore() {
        myGameArea.context.font = "20px" + " " + "Consolas";
        myGameArea.context.fillStyle = myColors.textColor;
        myGameArea.context.fillText("High Score: " + highScore, 300, 80)
    }

    function updateHighScore() {
        if (highScore < score)
            highScore = score;
        localStorage.setItem('HighScore', highScore);
    }

    function resetHighScore() {
        localStorage.setItem('HighScore', 0);
    }

    // Used for demo mode
    function needToJump() {
        var atJumpY = false;

        // if the game piece gets close to the bottom, jump
        if (myGameArea.frameNo < 150) {
            if (myGamePiece.y > (myGameArea.canvas.height - 60))
                return true;
            else
                return false;
        }

        if (myGamePiece.y > currentY - 5)
            atJumpY = true;

        return atJumpY;
    }


})();