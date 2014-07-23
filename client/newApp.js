var snakeBoard = document.getElementById("snakeBoard");
var context = snakeBoard.getContext("2d");
var snakeBoardHeight = $("#snakeBoard").height();
var snakeBoardWidth= $("#snakeBoard").width();

var disableButtons = function() {
  $("#start-game").prop("disabled", true);
  $("#difficulty").prop("disabled", true);
};

var enableButtons = function() {
  $("#start-game").removeAttr("disabled");
};

var keyCodes  = {
  37 : "left",
  38 : "up",
  39 : "right",
  40 : "down"
};


$(document).ready(function(){
  //"http://burta.hackbulgaria.com:3000"
  var
    server = "http://127.0.0.1:3000",
    isHost = false,
    socket = new io(server),
    gameId = "",
    socketId = "",
    currentPlayer = "",
    player1,
    player2,
    speed = 400;

  var Point = function(xCoord, yCoord, size) {
    this.draw = function(color, image) {
      if (image === undefined){
        context.fillStyle = color || "blue";
        context.fillRect(xCoord * size, yCoord * size, 10, 10);
      } else {
        context.drawImage(image, xCoord*size, yCoord*size, 10, 10);
      }
    };
    this.getxCoord = function(){
      return xCoord;
    };
    this.getyCoord = function(){
      return yCoord;
    };
    this.equals = function(secondPoint) {
      return xCoord === secondPoint.getxCoord() && yCoord === secondPoint.getyCoord();
    };
  };
  socket.on("connect", function(data){
    socketId = socket.io.engine.id;
  });
  var food = (function(context) {
    var image = document.getElementById("food");
    var point = new Point(Math.round(((Math.random() * (snakeBoardHeight -1)) + 1)/10), Math.round(((Math.random() * (snakeBoardWidth -1)) + 1)/10) ,10);

    var draw = function() {
      point.draw(undefined, image);
    };

    var changePosition = function() {
      var xCoord = Math.round((Math.random() * (snakeBoardHeight -10))/10);
      var yCoord = Math.round((Math.random() * (snakeBoardWidth -10))/10);
      point = new Point(xCoord, yCoord ,10);
    };
    var getFood = function() {
      return point;
    };
    var getPosition = function(){
      return [point.getxCoord(), point.getyCoord()];
    };

    return {
      draw : draw,
      changePosition : changePosition,
      getFood : getFood,
      getPosition : getPosition
    };
  }(context));

  var Snake = function(arr, color) {
    var body = [];
    arr.forEach(function(i){
      body.push(new Point(i, 0, 10))
    });
    var currentHead = body[body.length - 1];
    var direction = "right";
    var ate = false;
    this.draw = function() {
      body.forEach(function(point) {
        point.draw(color);
      });
    };
    this.resetSnake = function() {
      body = [];
      arr.forEach(function(i){
        body.push(new Point(i, 0, 10))
      });
      direction = "right";
    };

    this.getSnake = function() {
      return {
        body: body,
        currentHead: currentHead
      };
    };

    this.setDirection = function(newDirection) {
      if(newDirection === "left" && direction === "right") {
        return false;
      }
      if(newDirection === "up" && direction === "down") {
        return false;
      }
      if(newDirection === "right" && direction === "left") {
        return false;
      }
      if(newDirection === "down" && direction === "up") {
        return false;
      }
      direction = newDirection;
    };

    this.getBody = function(){
      var result = [];
      body.forEach(function(tile){
        result.push([tile.getxCoord(), tile.getyCoord()]);
      });
      console.log(result);
      return result;
    };

    this.eating = function(){
      if (currentHead.equals(food.getFood())) {
        food.changePosition();
        ate = true
      } else {
        return false;
      }
    };

    this.move = function() {
      var newHead;
      if(direction === "left") {
        newHead = new Point (currentHead.getxCoord() - 1, currentHead.getyCoord(), 10);
      } else if(direction === "right") {
        newHead = new Point (currentHead.getxCoord() + 1, currentHead.getyCoord(), 10);
      } else if(direction === "down") {
        newHead = new Point (currentHead.getxCoord(), currentHead.getyCoord() + 1, 10);
      } else if(direction === "up") {
        newHead = new Point (currentHead.getxCoord(), currentHead.getyCoord() - 1, 10);
      }
      body.push(newHead);
      if (ate === false ){
      body.shift();
      } else {
        ate = false;
      }
      currentHead = newHead;
    };
  };
  var snake = new Snake([1,2,3], "blue");;
  var snake2;
  var gameLoop;
  var clearBoard = function() {
      context.clearRect(0, 0, snakeBoardHeight, snakeBoardWidth);
  };
  var checkForColision = function(info) {
    var headToTale = info.body.some(function(element, index){
      return (index !== info.body.length - 1 && element.equals(info.currentHead));
    });
    var outOfBoard = info.currentHead.getyCoord() * 10 === snakeBoardWidth || info.currentHead.getxCoord() * 10 === snakeBoardHeight || info.currentHead.getxCoord() < 0 || info.currentHead.getyCoord() < 0;
    var colision = headToTale || outOfBoard;
    return colision;
  };

  var startGame = function() {
      disableButtons();
      gameLoop = setInterval(function() {
      context.clearRect(0, 0, snakeBoardWidth, snakeBoardHeight)
      snake.move();
      if(checkForColision(snake.getSnake())){
        clearInterval(gameLoop);
        context.font = "30px Arial";
        context.fillText("GAME OVER!!!!!", 50, 200);
        enableButtons();
      } else {
      snake.eating();
      snake.draw();
      food.draw();
      }
    }, speed);
  };

  var startMultiplayerGame = function(){
    disableButtons();
    gameLoop = setInterval(function(){
      context.clearRect(0, 0, snakeBoardWidth, snakeBoardHeight);
      snake.move();
      snake2.move();
      if(checkForColision(snake.getSnake()) || checkForColision(snake2.getSnake())){
        clearInterval(gameLoop);
        context.font = "30px Arial";
        context.fillText("GAME OVER!!!!!", 50, 200);
        enableButtons();
      } else {
      snake.eating();
      snake2.eating();
      sendMove();
      snake.draw();
      snake2.draw();
      food.draw();
      }
    }, speed);
  }

  var getUsername = function(){
    return $("#username").val();
  };

  var hostGame = function(){
    $.ajax({
      url: server + "/createGame",
      type: "POST",
      contentType: "application/json",
      dataType: "json",
      data: JSON.stringify({
        playerName: getUsername(),
        socketId: socketId})
    }).done(function(data){
      gameId = data.gameId;
      $("#game-id").val(gameId)
      console.log(gameId);
    });
  };

  var joinGame = function(){
    //"http://burta.hackbulgaria.com:3000/joinGame",
    gameId = $("#game-id").val();
    // console.log(socketId);
    $.ajax({
      url: server + "/joinGame",
      type: "POST",
      contentType: "application/json",
      dataType: "json",
      data: JSON.stringify({
        playerName: getUsername(),
        socketId: socketId,
        gameId: gameId})
    }).done(function(){
      console.log("connected");
    });
  };

  $(document).keydown(function(event){
    if(!isHost) {
      socket.emit("move", {
        gameId: gameId,
        from: currentPlayer,
        newDirection: event.keyCode
      })
    } else {
      snake.setDirection(keyCodes[event.keyCode]);
    }
  });

  $("#start-game").on("click", function(){
    clearBoard();
    startGame();
  });

  $("#create-game").on("click", function(){
    hostGame();
    isHost = true;
    currentPlayer = getUsername();
    context.font = "30px Arial";
    context.fillText("Waiting for second player", 50, 200);

  });

  $("#join-game").on("click", function(){
    currentPlayer = getUsername();
    joinGame();
  });

  var sendMove = function() {
    socket.emit("move", {
        gameId: gameId,
        from: currentPlayer,
        snake1: snake.getBody(),
        snake2: snake2.getBody(),
        food: food.getPosition()
      });
  };
  //drawing snake when you're guest in the game
  var drawSnake = function(body, color){
    body.forEach(function(coords){
      var tile = new Point(coords[0], coords[1], 10);
      tile.draw(color);
    });
  };

  socket.on("render", function(data){
    if("newDirection" in data && isHost) {
      snake2.setDirection(keyCodes[data.newDirection]);
    };
    if(!isHost && currentPlayer !== data.from) {
      context.clearRect(0, 0, snakeBoardWidth, snakeBoardHeight);
      drawSnake(data.snake1);
      drawSnake(data.snake2, "red");
      var food = new Point(data.food[0], data.food[1], 10);
      food.draw(document.getElementById("food"));
      // snake2.draw();
    }
  });

  //problem somewher over here

  socket.on("start", function(data){
    console.log("starteddddddd");
    clearBoard();
    if (isHost) {
      snake = new Snake([1,2,3], "blue");
      snake2 = new Snake([10,11,12], "red");
      startMultiplayerGame();
    }
    player1 = data.player1;
    player2 = data.player2;
  });
});
