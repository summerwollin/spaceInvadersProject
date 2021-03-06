/*
    Game Class

    The Game class represents a Space Invaders game.
    Create an instance of it, change any of the default values
    in the settings, and call 'start' to run the game.

    Call 'initialise' before 'start' to set the canvas the game
    will draw to.

    Call 'moveShip' or 'shipFire' to control the ship.

    Listen for 'gameWon' or 'gameLost' events to handle the game
    ending.
*/

//  Creates an instance of the Game class.
$(function() {

  var gamepad = null;

  var highScores = [0, 0, 0];
  var userid = localStorage.getItem("userid");
  var score = localStorage.getItem("score");
  var hScores = localStorage.getItem("hScores");

  function setHighScores(newScore) {
    highScores.push(newScore);
    highScores.sort(function(low, high) {
      return high - low;
    });
    highScores = highScores.slice(0, 3);
  }

  if (hScores) {
    hScores = hScores.split(',');
    $('ol li:nth-child(1)').text(hScores[0]);
    highScores[0] = hScores[0];
    $('ol li:nth-child(2)').text(hScores[1]);
    highScores[1] = hScores[1];
    $('ol li:nth-child(3)').text(hScores[2]);
    highScores[1] = hScores[1];
  }

  if (userid) {
    $('#scores').html(userid + "'s High Scores:");
  }

  //toggle mute on button press
  $('#muteLink').on('click', function(e) {
    return toggleMute();
  });

  function toggleMute() {
    if ($('audio')[0].paused) {
      $('audio')[0].play();
    } else {
      $('audio')[0].pause();
    }
    game.mute();
    $("#muteLink")[0].innerText = game.sounds.mute ? "unmute" : "mute";
  }

  function ViewMode(shipSrc, invaderSrc, width, height) {
    this.shipImg = new Image();
    this.shipImg.src = shipSrc;

    this.invaderImg = new Image();
    this.invaderImg.src = invaderSrc;

    this.shipWidth = width;
    this.shipHeight = height;
  }

  function Game() {

    //  Set the initial config.
    this.config = {
      bombRate: 0.05,
      bombMinVelocity: 50,
      bombMaxVelocity: 50,
      invaderInitialVelocity: 25,
      invaderAcceleration: 0,
      invaderDropDistance: 20,
      rocketVelocity: 120,
      rocketMaxFireRate: 2,
      gameWidth: 400,
      gameHeight: 300,
      fps: 50,
      debugMode: false,
      invaderRanks: 5,
      invaderFiles: 10,
      shipSpeed: 120,
      levelDifficultyMultiplier: 0.2,
      pointsPerInvader: 5
    };

    //  All state is in the variables below.
    this.lives = 3;
    this.width = 0;
    this.height = 0;
    this.gameBounds = {
      left: 0,
      top: 0,
      right: 0,
      bottom: 0
    };
    this.intervalId = 0;
    this.score = 0;
    this.level = 1;

    //  The state stack.
    this.stateStack = [];

    //  Input/output
    this.pressedKeys = {};
    this.gameCanvas = null;

    // //  All sounds.
    this.sounds = null;
  }

  //  Initialis the Game with a canvas.
  Game.prototype.initialise = function(gameCanvas) {

    //  Set the game canvas.
    this.gameCanvas = gameCanvas;

    //  Set the game width and height.
    this.width = gameCanvas.width;
    this.height = gameCanvas.height;

    //  Set the state game bounds.
    this.gameBounds = {
      left: gameCanvas.width / 2 - this.config.gameWidth / 2,
      right: gameCanvas.width / 2 + this.config.gameWidth / 2,
      top: gameCanvas.height / 2 - this.config.gameHeight / 2,
      bottom: gameCanvas.height / 2 + this.config.gameHeight / 2,
    };

  };

  Game.prototype.moveToState = function(state) {

    //  If we are in a state, leave it.
    if (this.currentState() && this.currentState().leave) {
      this.currentState().leave(game);
      this.stateStack.pop();
    }

    //  If there's an enter function for the new state, call it.
    if (state.enter) {
      state.enter(game);
    }

    //  Set the current state.
    this.stateStack.pop();
    this.stateStack.push(state);
  };

  //  Start the Game.
  Game.prototype.start = function() {

    //  Move into the 'welcome' state.
    this.moveToState(new WelcomeState());

    //  Set the game variables.
    this.lives = 3;
    this.config.debugMode = /debug=true/.test(window.location.href);

    //  Start the game loop.
    var game = this;
    this.intervalId = setInterval(function() {
      GameLoop(game);
    }, 1000 / this.config.fps);

  };

  //  Returns the current state.
  Game.prototype.currentState = function() {
    return this.stateStack.length > 0 ? this.stateStack[this.stateStack.length - 1] : null;
  };

  Game.prototype.mute = function(mute) {

    //  If we've been told to mute, mute.
    if (mute === true) {
      this.sounds.mute = true;
    } else if (mute === false) {
      this.sounds.mute = false;
    } else {
      // Toggle mute instead...
      this.sounds.mute = this.sounds.mute ? false : true;
    }
  };


  //  The main loop.
  function GameLoop(game) {
    var currentState = game.currentState();
    if (currentState) {

      //  Delta t is the time to update/draw.
      var dt = 1 / game.config.fps;

      //  Get the drawing context.
      var ctx = this.gameCanvas.getContext("2d");

      //  Update if we have an update function. Also draw
      //  if we have a draw function.
      if (currentState.update) {
        currentState.update(game, dt);
      }
      if (currentState.draw) {
        currentState.draw(game, dt, ctx);
      }

    }
  }

  Game.prototype.pushState = function(state) {

    //  If there's an enter function for the new state, call it.
    if (state.enter) {
      state.enter(game);
    }
    //  Set the current state.
    this.stateStack.push(state);
  };

  Game.prototype.popState = function() {

    //  Leave and pop the state.
    if (this.currentState()) {
      if (this.currentState().leave) {
        this.currentState().leave(game);
      }

      //  Set the current state.
      this.stateStack.pop();
    }
  };

  //  The stop function stops the game.
  Game.prototype.stop = function Stop() {
    clearInterval(this.intervalId);
  };

  //  Inform the game a key is down.
  Game.prototype.keyDown = function(keyCode) {
    this.pressedKeys[keyCode] = true;
    if (keyCode === 18) {
      if (currentModeNumber === 0) {
        currentMode = githubMode;
        currentModeNumber = 1;
        $('#gameCanvas').css('background-color', '#F5DC96');
      } else if (currentModeNumber === 1) {
        currentMode = cookieMode;
        currentModeNumber = 2;
        $('#gameCanvas').css('background-color', '#25BFFF');
      } else if (currentModeNumber === 2) {
        currentMode = invadersMode;
        currentModeNumber = 0;
        $('#gameCanvas').css('background-color', '#232E37');
      }
    }
    //  Delegate to the current state too.
    if (this.currentState() && this.currentState().keyDown) {
      this.currentState().keyDown(this, keyCode);
    }
  };

  //  Inform the game a key is up.
  Game.prototype.keyUp = function(keyCode) {
    delete this.pressedKeys[keyCode];
    //  Delegate to the current state too.
    if (this.currentState() && this.currentState().keyUp) {
      this.currentState().keyUp(this, keyCode);
    }
  };

  function WelcomeState() {

  }

  WelcomeState.prototype.enter = function(game) {

    // Create and load the sounds.
    game.sounds = new Sounds();
    game.sounds.init();
    game.sounds.loadSound('shoot', 'sounds/shoot.wav');
    game.sounds.loadSound('bang', 'sounds/bang.wav');
    game.sounds.loadSound('explosion', 'sounds/explosion.wav');
  };

  WelcomeState.prototype.update = function(game, dt) {


  };

  WelcomeState.prototype.draw = function(game, dt, ctx) {

    //  Clear the background.
    ctx.clearRect(0, 0, game.width, game.height);

    ctx.font = "30px arcadeFont";
    ctx.fillStyle = '#ffffff';
    ctx.textBaseline = "center";
    ctx.textAlign = "center";
    ctx.fillText("Space Invaders", game.width / 2, game.height / 2 - 40);
    ctx.font = "16px arcadeFont";

    ctx.fillText("Press 'Space' to start.", game.width / 2, game.height / 2);

    if (userid) {
      ctx.fillText("Welcome back, " + userid + "!", game.width / 2, game.height / 2 + 40);
    }

  };

  WelcomeState.prototype.keyDown = function(game, keyCode) {
    if (keyCode == 32) /*space*/ {
      //  Space starts the game.
      game.level = 1;
      game.score = 0;
      game.lives = 3;
      game.moveToState(new LevelIntroState(game.level));
    }
  };

  function GameOverState() {

  }

  GameOverState.prototype.update = function(game, dt) {

  };

  GameOverState.prototype.draw = function(game, dt, ctx) {

    //  Clear the background.
    ctx.clearRect(0, 0, game.width, game.height);

    ctx.font = "30px arcadeFont";
    ctx.fillStyle = '#ffffff';
    ctx.textBaseline = "center";
    ctx.textAlign = "center";
    ctx.fillText("Game Over!", game.width / 2, game.height / 2 - 40);
    ctx.font = "16px arcadeFont";
    ctx.fillText("You scored " + game.score + " and got to level " + game.level, game.width / 2, game.height / 2);
    ctx.font = "16px arcadeFont";
    ctx.fillText("Press 'Space' to play again.", game.width / 2, game.height / 2 + 40);

    //add last game score to game over screen
    if (score) {
      if (userid) {
        ctx.fillText("(" + userid + "'s last score: " + score + ")", game.width / 2, game.height / 2 + 80);
      } else {
        ctx.fillText("(Last score: " + score + ")", game.width / 2, game.height / 2 + 80);
      }
    }

    localStorage.setItem("score", game.score);


  };

  GameOverState.prototype.keyDown = function(game, keyCode) {
    if (keyCode == 32) /*space*/ {
      //  Space restarts the game.
      setHighScores(game.score);
      localStorage.setItem("hScores", highScores);
      $('ol li:nth-child(1)').text(highScores[0]);
      $('ol li:nth-child(2)').text(highScores[1]);
      $('ol li:nth-child(3)').text(highScores[2]);

      score = localStorage.getItem("score");
      game.lives = 3;
      game.score = 0;
      game.level = 1;
      game.moveToState(new LevelIntroState(1));
    }
  };

  //  Create a PlayState with the game config and the level you are on.
  function PlayState(config, level) {
    this.config = config;
    this.level = level;

    //  Game state.
    this.invaderCurrentVelocity = 10;
    this.invaderCurrentDropDistance = 0;
    this.invadersAreDropping = false;
    this.lastRocketTime = null;

    //  Game entities.
    this.ship = null;
    this.invaders = [];
    this.rockets = [];
    this.bombs = [];
  }

  PlayState.prototype.enter = function(game) {

    //  Create the ship.
    this.ship = new Ship(game.width / 2, game.gameBounds.bottom);

    //  Setup initial state.
    this.invaderCurrentVelocity = 10;
    this.invaderCurrentDropDistance = 0;
    this.invadersAreDropping = false;

    //  Set the ship speed for this level, as well as invader params.
    var levelMultiplier = this.level * this.config.levelDifficultyMultiplier;
    this.shipSpeed = this.config.shipSpeed;
    this.invaderInitialVelocity = this.config.invaderInitialVelocity + (levelMultiplier * this.config.invaderInitialVelocity);
    this.bombRate = this.config.bombRate + (levelMultiplier * this.config.bombRate);
    this.bombMinVelocity = this.config.bombMinVelocity + (levelMultiplier * this.config.bombMinVelocity);
    this.bombMaxVelocity = this.config.bombMaxVelocity + (levelMultiplier * this.config.bombMaxVelocity);

    //  Create the invaders.
    var ranks = this.config.invaderRanks;
    var files = this.config.invaderFiles;
    var invaders = [];
    for (var rank = 0; rank < ranks; rank++) {
      for (var file = 0; file < files; file++) {
        invaders.push(new Invader(
          (game.width / 2) + ((files / 2 - file) * 200 / files),
          (game.gameBounds.top + rank * 20),
          rank, file, 'Invader'));
      }
    }
    this.invaders = invaders;
    this.invaderCurrentVelocity = this.invaderInitialVelocity;
    this.invaderVelocity = {
      x: -this.invaderInitialVelocity,
      y: 0
    };
    this.invaderNextVelocity = null;
  };

  PlayState.prototype.update = function(game, dt) {

    //  If the left or right arrow keys are pressed, move
    //  the ship. Check this on ticks rather than via a keydown
    //  event for smooth movement, otherwise the ship would move
    //  more like a text editor caret.
    if (game.pressedKeys[37]) {
      this.ship.x -= this.shipSpeed * dt;
    }
    if (game.pressedKeys[39]) {
      this.ship.x += this.shipSpeed * dt;
    }
    if (game.pressedKeys[32]) {
      this.fireRocket();
    }

    //  Keep the ship in bounds.
    if (this.ship.x < game.gameBounds.left) {
      this.ship.x = game.gameBounds.left;
    }
    if (this.ship.x > game.gameBounds.right) {
      this.ship.x = game.gameBounds.right;
    }

    //  Move each bomb.
    for (var i = 0; i < this.bombs.length; i++) {
      var bomb = this.bombs[i];
      bomb.y += dt * bomb.velocity;

      //  If the rocket has gone off the screen remove it.
      if (bomb.y > this.height) {
        this.bombs.splice(i--, 1);
      }
    }

    //  Move each rocket.
    for (i = 0; i < this.rockets.length; i++) {
      var rocket = this.rockets[i];
      rocket.y -= dt * rocket.velocity;

      //  If the rocket has gone off the screen remove it.
      if (rocket.y < 0) {
        this.rockets.splice(i--, 1);
      }
    }

    //  Move the invaders.
    var hitLeft = false,
      hitRight = false,
      hitBottom = false;
    for (i = 0; i < this.invaders.length; i++) {
      var invader = this.invaders[i];
      var newx = invader.x + this.invaderVelocity.x * dt;
      var newy = invader.y + this.invaderVelocity.y * dt;
      if (hitLeft == false && newx < game.gameBounds.left) {
        hitLeft = true;
      } else if (hitRight == false && newx > game.gameBounds.right) {
        hitRight = true;
      } else if (hitBottom == false && newy > game.gameBounds.bottom) {
        hitBottom = true;
      }

      if (!hitLeft && !hitRight && !hitBottom) {
        invader.x = newx;
        invader.y = newy;
      }
    }

    //  Update invader velocities.
    if (this.invadersAreDropping) {
      this.invaderCurrentDropDistance += this.invaderVelocity.y * dt;
      if (this.invaderCurrentDropDistance >= this.config.invaderDropDistance) {
        this.invadersAreDropping = false;
        this.invaderVelocity = this.invaderNextVelocity;
        this.invaderCurrentDropDistance = 0;
      }
    }
    //  If we've hit the left, move down then right.
    if (hitLeft) {
      this.invaderCurrentVelocity += this.config.invaderAcceleration;
      this.invaderVelocity = {
        x: 0,
        y: this.invaderCurrentVelocity
      };
      this.invadersAreDropping = true;
      this.invaderNextVelocity = {
        x: this.invaderCurrentVelocity,
        y: 0
      };
    }
    //  If we've hit the right, move down then left.
    if (hitRight) {
      this.invaderCurrentVelocity += this.config.invaderAcceleration;
      this.invaderVelocity = {
        x: 0,
        y: this.invaderCurrentVelocity
      };
      this.invadersAreDropping = true;
      this.invaderNextVelocity = {
        x: -this.invaderCurrentVelocity,
        y: 0
      };
    }
    //  If we've hit the bottom, it's game over.
    if (hitBottom) {
      this.lives = 0;
    }

    //  Check for rocket/invader collisions.
    for (i = 0; i < this.invaders.length; i++) {
      var invader = this.invaders[i];
      var bang = false;

      for (var j = 0; j < this.rockets.length; j++) {
        var rocket = this.rockets[j];

        if (rocket.x >= (invader.x - invader.width / 2) && rocket.x <= (invader.x + invader.width / 2) &&
          rocket.y >= (invader.y - invader.height / 2) && rocket.y <= (invader.y + invader.height / 2)) {

          //  Remove the rocket, set 'bang' so we don't process
          //  this rocket again.
          this.rockets.splice(j--, 1);
          bang = true;
          game.score += this.config.pointsPerInvader;
          break;
        }
      }
      if (bang) {
        this.invaders.splice(i--, 1);
        game.sounds.playSound('bang');
      }
    }

    //  Find all of the front rank invaders.
    var frontRankInvaders = {};
    for (var i = 0; i < this.invaders.length; i++) {
      var invader = this.invaders[i];
      //  If we have no invader for game file, or the invader
      //  for game file is futher behind, set the front
      //  rank invader to game one.
      if (!frontRankInvaders[invader.file] || frontRankInvaders[invader.file].rank < invader.rank) {
        frontRankInvaders[invader.file] = invader;
      }
    }

    //  Give each front rank invader a chance to drop a bomb.
    for (var i = 0; i < this.config.invaderFiles; i++) {
      var invader = frontRankInvaders[i];
      if (!invader) continue;
      var chance = this.bombRate * dt;
      if (chance > Math.random()) {
        //  Fire!
        this.bombs.push(new Bomb(invader.x, invader.y + invader.height / 2,
          this.bombMinVelocity + Math.random() * (this.bombMaxVelocity - this.bombMinVelocity)));
      }
    }

    //  Check for bomb/ship collisions.
    for (var i = 0; i < this.bombs.length; i++) {
      var bomb = this.bombs[i];
      if (bomb.x >= (this.ship.x - this.ship.width / 2) && bomb.x <= (this.ship.x + this.ship.width / 2) &&
        bomb.y >= (this.ship.y - this.ship.height / 2) && bomb.y <= (this.ship.y + this.ship.height / 2)) {
        this.bombs.splice(i--, 1);
        game.lives--;
        game.sounds.playSound('explosion');
      }

    }

    //  Check for invader/ship collisions.
    for (var i = 0; i < this.invaders.length; i++) {
      var invader = this.invaders[i];
      if ((invader.x + invader.width / 2) > (this.ship.x - this.ship.width / 2) &&
        (invader.x - invader.width / 2) < (this.ship.x + this.ship.width / 2) &&
        (invader.y + invader.height / 2) > (this.ship.y - this.ship.height / 2) &&
        (invader.y - invader.height / 2) < (this.ship.y + this.ship.height / 2)) {
        //  Dead by collision!
        game.lives = 0;
        game.sounds.playSound('explosion');
      }
    }

    //  Check for failure
    if (game.lives <= 0) {
      game.moveToState(new GameOverState());
    }

    //  Check for victory
    if (this.invaders.length === 0) {
      game.score += this.level * 50;
      game.level += 1;
      game.moveToState(new LevelIntroState(game.level));
    }

  };

  PlayState.prototype.draw = function(game, dt, ctx) {

    //  Clear the background.
    ctx.clearRect(0, 0, game.width, game.height);

    //  Draw ship.
    ctx.drawImage(currentMode.shipImg, this.ship.x - currentMode.shipWidth / 2, this.ship.y - currentMode.shipHeight / 2, currentMode.shipWidth, currentMode.shipHeight);

    //  Draw invaders.
    ctx.fillStyle = '#006600';
    for (var i = 0; i < this.invaders.length; i++) {
      var invader = this.invaders[i];
      ctx.drawImage(currentMode.invaderImg, invader.x - invader.width / 2, invader.y - invader.height / 2, invader.width, invader.height);
    }

    //  Draw bombs.
    ctx.fillStyle = '#ff5555';
    for (var i = 0; i < this.bombs.length; i++) {
      var bomb = this.bombs[i];
      ctx.fillRect(bomb.x - 2, bomb.y - 2, 4, 4);
    }

    //  Draw rockets.
    ctx.fillStyle = '#ff0000';
    for (var i = 0; i < this.rockets.length; i++) {
      var rocket = this.rockets[i];
      ctx.fillRect(rocket.x, rocket.y - 2, 1, 4);
    }

    //  Draw info.
    var textYpos = game.gameBounds.bottom + ((game.height - game.gameBounds.bottom) / 2) + 14 / 2;
    ctx.font = "14px arcadeFont";
    ctx.fillStyle = '#ffffff';
    // var info = "Lives: " + game.lives;
    var info = "Score: " + game.score;
    ctx.textAlign = "left";
    ctx.fillText(info, game.gameBounds.left - 15, textYpos);
    info = "Lives: " + game.lives + "   Level: " + game.level;
    ctx.textAlign = "right";
    ctx.fillText(info, game.gameBounds.right + 8, textYpos);

    //  If we're in debug mode, draw bounds.
    if (this.config.debugMode) {
      ctx.strokeStyle = '#ff0000';
      ctx.strokeRect(0, 0, game.width, game.height);
      ctx.strokeRect(game.gameBounds.left, game.gameBounds.top,
        game.gameBounds.right - game.gameBounds.left,
        game.gameBounds.bottom - game.gameBounds.top);
    }

  };

  PlayState.prototype.keyDown = function(game, keyCode) {

    if (keyCode == 32) {
      //  Fire!
      this.fireRocket();
    }

  };

  PlayState.prototype.keyUp = function(game, keyCode) {

  };

  PlayState.prototype.fireRocket = function() {
    //  If we have no last rocket time, or the last rocket time
    //  is older than the max rocket rate, we can fire.
    if (this.lastRocketTime === null || ((new Date()).valueOf() - this.lastRocketTime) > (1000 / this.config.rocketMaxFireRate)) {
      //  Add a rocket.
      this.rockets.push(new Rocket(this.ship.x, this.ship.y - 12, this.config.rocketVelocity));
      this.lastRocketTime = (new Date()).valueOf();

      //  Play the 'shoot' sound.
      game.sounds.playSound('shoot');
    }
  };

  /*
      Level Intro State

      The Level Intro state shows a 'Level X' message and
      a countdown for the level.
  */
  function LevelIntroState(level) {
    this.level = level;
    this.countdownMessage = "3";
  }

  LevelIntroState.prototype.update = function(game, dt) {

    //  Update the countdown.
    if (this.countdown === undefined) {
      this.countdown = 3; // countdown from 3 secs
    }
    this.countdown -= dt;

    if (this.countdown < 2) {
      this.countdownMessage = "2";
    }
    if (this.countdown < 1) {
      this.countdownMessage = "1";
    }
    if (this.countdown <= 0) {
      //  Move to the next level, popping this state.
      game.moveToState(new PlayState(game.config, this.level));
    }

  };

  LevelIntroState.prototype.draw = function(game, dt, ctx) {

    //  Clear the background.
    ctx.clearRect(0, 0, game.width, game.height);

    ctx.font = "36px arcadeFont";
    ctx.fillStyle = '#ffffff';
    ctx.textBaseline = "middle";
    ctx.textAlign = "center";
    ctx.fillText("Level " + this.level, game.width / 2, game.height / 2);
    ctx.font = "24px arcadeFont";
    ctx.fillText("Ready in " + this.countdownMessage, game.width / 2, game.height / 2 + 36);
    return;
  };


  /*

    Ship

    The ship has a position and that's about it.

  */
  function Ship(x, y) {
    this.x = x;
    this.y = y;
    this.width = 20;
    this.height = 16;
  }

  /*
      Rocket

      Fired by the ship, they've got a position, velocity and state.

      */
  function Rocket(x, y, velocity) {
    this.x = x;
    this.y = y;
    this.velocity = velocity;
  }

  /*
      Bomb

      Dropped by invaders, they've got position, velocity.

  */
  function Bomb(x, y, velocity) {
    this.x = x;
    this.y = y;
    this.velocity = velocity;
  }

  /*
      Invader

      Invader's have position, type, rank/file and that's about it.
  */

  function Invader(x, y, rank, file, type) {
    this.x = x;
    this.y = y;
    this.rank = rank;
    this.file = file;
    this.type = type;
    this.width = 18;
    this.height = 14;
  }

  /*
      Game State

      A Game State is simply an update and draw proc.
      When a game is in the state, the update and draw procs are
      called, with a dt value (dt is delta time, i.e. the number)
      of seconds to update or draw.

  */
  function GameState(updateProc, drawProc, keyDown, keyUp, enter, leave) {
    this.updateProc = updateProc;
    this.drawProc = drawProc;
    this.keyDown = keyDown;
    this.keyUp = keyUp;
    this.enter = enter;
    this.leave = leave;
  }

  /*

      Sounds

      The sounds class is used to asynchronously load sounds and allow
      them to be played.

  */
  function Sounds() {

    //  The audio context.
    this.audioContext = null;

    //  The actual set of loaded sounds.
    this.sounds = {};
  }

  Sounds.prototype.init = function() {

    //  Create the audio context, paying attention to webkit browsers.
    context = window.AudioContext || window.webkitAudioContext;
    this.audioContext = new context();
    this.mute = false;
  };

  Sounds.prototype.loadSound = function(name, url) {

    //  Reference to ourselves for closures.
    var self = this;

    //  Create an entry in the sounds object.
    this.sounds[name] = null;

    //  Create an asynchronous request for the sound.
    var req = new XMLHttpRequest();
    req.open('GET', url, true);
    req.responseType = 'arraybuffer';
    req.onload = function() {
      self.audioContext.decodeAudioData(req.response, function(buffer) {
        self.sounds[name] = {
          buffer: buffer
        };
      });
    };
    try {
      req.send();
    } catch (e) {
      console.log("An exception occured getting sound the sound " + name + " this might be " +
        "because the page is running from the file system, not a webserver.");
      console.log(e);
    }
  };

  Sounds.prototype.playSound = function(name) {

    //  If we've not got the sound, don't bother playing it.
    if (this.sounds[name] === undefined || this.sounds[name] === null || this.mute === true) {
      return;
    }

    //  Create a sound source, set the buffer, connect to the speakers and
    //  play the sound.
    var source = this.audioContext.createBufferSource();
    source.buffer = this.sounds[name].buffer;
    source.connect(this.audioContext.destination);
    source.start(0);
  };

  //  Setup the canvas.
  var canvas = document.getElementById("gameCanvas");
  canvas.width = 800;
  canvas.height = 600;

  var invadersMode = new ViewMode('img/spaceship-orange.png', 'img/aliensprite.gif', 30, 30);
  var githubMode = new ViewMode('img/octocat.png', 'img/bitbucket.png', 35, 35);
  var cookieMode = new ViewMode('img/milk.png', 'img/cookie.png', 20, 35);

  var currentMode = invadersMode;
  var currentModeNumber = 0;

  //  Create the game.
  var game = new Game();

  //  Initialise it with the game canvas.
  game.initialise(canvas);

  //  Start the game.
  game.start();

  //  Listen for keyboard events.
  window.addEventListener("keydown", function keydown(e) {
    var keycode = e.which || window.event.keycode;
    //  Supress further processing of left/right/space (37/29/32)
    if (keycode == 37 || keycode == 39 || keycode == 32 || keycode == 18) {
      e.preventDefault();
    }
    game.keyDown(keycode);
  });
  window.addEventListener("keyup", function keydown(e) {
    var keycode = e.which || window.event.keycode;
    game.keyUp(keycode);
  });

  var lastButton;
  var lastIndex;

  function gamepadStateUpdate(oldValue, newValue, injectedkeycode, index) {
    if (oldValue === newValue) {
      return;
    }

    if (newValue === false) {
      game.keyUp(injectedkeycode);
    } else {
      game.keyDown(injectedkeycode);
    }
  }

  var gamepadLeftDown = false;
  var gamepadRightDown = false;
  var gamepadAxisLeft = false;
  var gamepadAxisRight = false;
  var gamepadTrigger = false;
  var gamepadA = false;

  var applyDeadzone = function(number, threshold) {
    percentage = (Math.abs(number) - threshold) / (1 - threshold);

    if (percentage < 0) {
      percentage = 0;
    }

    return percentage * (number > 0 ? 1 : -1);
  }

  function pollGamepad() {
    var gamepad = navigator.getGamepads()[0];


    if (gamepad === undefined) {
      return;
    }

    var buttons = gamepad.buttons;
    var axis = applyDeadzone(gamepad.axes[0], 0.25);

    var axisLeft;
    var axisRight;

    if (axis < -0.25) {
      axisLeft = true;
      axisRight = false;

    } else if (axis > 0.25) {
      axisRight = true;
      axisLeft = false;
    }


    gamepadStateUpdate(gamepadA, buttons[0].pressed, 18, 0);
    gamepadStateUpdate(gamepadLeftDown, buttons[14].pressed, 37, 14);
    gamepadStateUpdate(gamepadRightDown, buttons[15].pressed, 39, 15);
    gamepadStateUpdate(gamepadAxisLeft, axisLeft, 37);
    gamepadStateUpdate(gamepadAxisRight, axisRight, 39);
    gamepadStateUpdate(gamepadTrigger, buttons[7].pressed, 32, 7);

    gamepadA = buttons[0].pressed;
    gamepadLeftDown = buttons[14].pressed;
    gamepadRightDown = buttons[15].pressed;
    gamepadAxisLeft = axisLeft;
    gamepadAxisRight = axisRight;
    gamepadTrigger = buttons[7].pressed;

  }

  window.setInterval(pollGamepad, 10);

  //On click, change view mode
  $('#invaders').on("click", function() {
    currentMode = invadersMode;
    currentModeNumber = 0;
    $('#gameCanvas').css('background-color', '#232E37');
  });
  $('#github').on('click', function() {
    currentMode = githubMode;
    currentModeNumber = 1;
    $('#gameCanvas').css('background-color', '#F5DC96');
  });
  $('#cookie').on('click', function() {
    currentMode = cookieMode;
    currentModeNumber = 2;
    $('#gameCanvas').css('background-color', '#25BFFF');
  });

  //save userinput to local storage
  $('#submit').on('click', function() {
    var input = $('#userid')[0];
    localStorage.setItem("userid", input.value);
    $('#scores').html(userid + "'s High Scores:");
  });


});
