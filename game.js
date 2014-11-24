var game = {};

if (!Array.prototype.last){
    Array.prototype.last = function(){
        return this[this.length - 1];
    };
};

var NONE = 0, DRAGGING = 1;


game.alert = function(msg){
	console.log('Alert: ' + msg);
}

game.log = function(msg){
	console.log('Log: ' + msg);
}


game.nodeForCoordinates = function(x,y){
	return {x: Math.round(x / 30) - 1, y: Math.round(y / 30) - 1}; // returns a node location object with x,y
}

game.updateGrid = function(){
	// Set the weight of the nodes to 0 if there is an object on the node

	var nodesX = (500 - 20) / 30;
	var nodesY = (460 - 40) / 30;

	var nodes = [];
	var weight;
	for (var x = 0; x <= nodesX; x++) {
		nodes[x] = [];
		for (var y = 0; y <= nodesY; y++) {
			if( (x === 0 && y !== 8) || (x === 15 && y !== 8) || y === 0 || y === 14 ){
				weight = 0;
				var wall = {
					// Create wall 
					x: (30 * x) + 5, y: (30 * y) + 10, w: 30, h: 30, color: "rgba(0,0,0,.5)", type: 'towerPlacementGridSnapPositionShadow', canvas: 'base_canvas', draw: function(){
						game.ctx.fillStyle = this.color;
						game.ctx.fillRect(this.x, this.y, this.w, this.h);
					}
				};
				game.addObject(wall);
			}
			else {
				weight = 1;
			}
			nodes[x][y] = weight;
		}
	}

	for (var i = 0; i <= game.objects.length - 1; i++) {
		if(game.objects[i].type === 'towerItem'){
			var c = game.nodeForCoordinates(game.objects[i].x + 15,game.objects[i].y + 15);
			nodes[c.x][c.y] = 0;
			game.log('Node ' + c.x + ' ' + c.y + ' weight set to 0 (wall)');
			//game.log(nodes[c.x]);
		}
	};

	game.log('Updated Grid');


	game.grid = nodes;

}

game.init = function(){

	game.lastCreeperRelease = Date.now();

	game.starttime = Date.now();
	game.mouseup = true;
	game.mousedown = false;
	game.mouseState = NONE;

	game.DRAGGING_NEW_TOWER = false;

	game.container = document.getElementById('container');

	game.objects = [];
	game.creepers = [];
	game.score = 0;

	game.cash = 100;
	game.lives = 20;
	game.over = false;
	game.wave = 0;

	game.paused = false;


	// Define the 'grid' of positions on the battlefield.
	game.updateGrid();
	game.graph = new Graph(game.grid);

	game.start = game.graph.grid[0][8];
	game.end = game.graph.grid[15][8];
	game.path = astar.search(game.graph, game.start, game.end);
	// Layers needed
	// Game chrome (menus, buttons)
	// Tower drag layer
	// Tower layer
	// Bullets layer
	// Ground Enemies layer
	// Flying Enemies layer
	// 

	//game.canvases = ['base', 'towers', 'tower_drag', 'bullets','enemies'];
	game.canvases = ['base'];

	for(i = 0; i < game.canvases.length; i++){
		var canvas_name = game.canvases[i] + '_canvas';
		game[canvas_name] = document.createElement('canvas');
		game[canvas_name].setAttribute('id',canvas_name);
		game[canvas_name].setAttribute('class','game_canvas');
		game[canvas_name].setAttribute('width',500);
		game[canvas_name].setAttribute('height',500);
		game.container.appendChild(game[canvas_name]);

		


		game[canvas_name].addEventListener("mousemove", game.mousemoveHandler, false);
		game[canvas_name].addEventListener("mousedown",game.mousedownHandler,false);
		game[canvas_name].addEventListener("mouseup",game.mouseupHandler,false);
	}
	

	game.canvas = document.getElementById('base_canvas');
	game.ctx = game.canvas.getContext('2d');
	//game.ctx = game.canvas.getContext('2d');

	//game.canvas = document.getElementById('canvas');
	

	var towerPlacementGridSnapPositionShadow = {x: -100, y: -100, w: 30, h: 30, color: "rgba(0,100,0,.5)", type: 'towerPlacementGridSnapPositionShadow', canvas: 'base_canvas', draw: function(){
		game.ctx.fillStyle = this.color;
		game.ctx.fillRect(this.x, this.y, this.w, this.h);
	}};
	game.addObject(towerPlacementGridSnapPositionShadow);


	game.initTowerPicker();

	window.requestAnimationFrame(game.step);

}


game.addObject = function(obj){
	if(game.objects.length === 0){
		obj.id = 0;
	}
	else{
		obj.id = game.objects.last().id + 1;
	}
	game.objects.push(obj);
}

game.addCreeper = function(creeper){
	if(game.creepers.length === 0){
		creeper.id = 0;
	}
	else{
		creeper.id = game.creepers.last().id + 1;
	}
	game.creepers.push(creeper);
}


game.delObject = function(obj){
	game.objects = game.objects.filter(function(e){
		if(obj === e){
			return false;
		}
		return true;
	});
}

game.delCreeper = function(creeper){
	game.creepers = game.creepers.filter(function(e){
		if(creeper === e){
			return false;
		}
		return true;
	});
}

game.getObjectByType = function(type){
	for (var i = game.objects.length - 1; i >= 0; i--) {
		if(game.objects[i].type === type){
			return game.objects[i];
		}
	}
	return false;
}

game.delObjectByType = function(type){

	game.objects = game.objects.filter(function(e){
		if(type === e.type){
			return false;
		}
		return true;
	});
}


game.addTowerToPicker = function(color){

	if(game.towerPickerItems.length === 3){
		return false;
	}

	var towerColor;
	switch(color) {
		case 'grey':
			towerColor = "rgb(150,150,150)";
			damage = 1;
			range = 90;
			cost = 15;
			reloadTime = 1;
		break;
		case 'blue':
			towerColor = "rgb(0,0,200)";
			damage = 2;
			range = 90;
			cost = 20;
			reloadTime = 1;
		break;
		case 'red':
			towerColor = "rgb(200,0,0)";
			damage = 3;
			range = 70;
			cost = 30;
			reloadTime = 2;
		break;
	}

	var mousedownaction = function(){
		//console.log('Mouse down over a tower!');
	}
	var newTower = {x: (40 * (game.towerPickerItems.length + 1)), y: 465, w: 30, h: 30, reloadTime: reloadTime, range: range, damage: damage, cost: cost, color: towerColor, type: 'towerPickerItem', canvas: 'base_canvas', draggable: true, clickable: true, mousedown: mousedownaction, draw: function(){
		game.ctx.fillStyle = this.color;
		game.ctx.fillRect(this.x, this.y, this.w, this.h);
	}};

	

	game.towerPickerItems.push(newTower);
	game.addObject(newTower);

	return true;
}

game.initTowerPicker = function(){

	game.towerPickerItems = [];

	

	// Draw towers
	game.addTowerToPicker('grey');
	game.addTowerToPicker('blue');
	game.addTowerToPicker('red');
}





game.hitTest = function(event){

	for(i = 0; i < game.objects.length; i++){
		var obj = game.objects[i];

		// if event x within width of object AND y within height of object, return object
		if(event.pageX >= obj.x && event.pageX <= (obj.x + obj.w) && event.pageY >= obj.y && event.pageY <= (obj.y + obj.h)){
			return obj;
		}
	}
	
	return false;
}



game.mousemoveHandler = function(event){
	if(game.mousedown){
		//game.log('Cursor coordinates: (' + event.pageX + ',' + event.pageY + ')');

		game.mouseState = DRAGGING;

		if(game.DRAGGING_NEW_TOWER){

			// Light up the grid spots where the tower could land

			// Get the grid 'snap' position of the towerPlacementItem
			// topYBounds = ? = gridSnapPositionOriginY
			// bottomYBounds = ? = Doesn't matter
			// leftXBounds = ? = gridSnapPositionOriginX
			// rightXBounds = ? = Doesn't matter

			// padding of 10 px on top
			// padding of 5 px on left

			var gridSnapPositionOriginY = Math.round((event.pageY + 7) / 30);
			var gridSnapPositionOriginX = Math.round((event.pageX + 4) / 30);


			for (var i = game.objects.length - 1; i >= 0; i--) {
				if(game.objects[i].type === 'towerPlacementItem'){
					game.objects[i].x = event.pageX - 15;
					game.objects[i].y = event.pageY - 15;
				}

				if(game.objects[i].type === 'towerPlacementGridSnapPositionShadow'){
					if((event.pageY + 5) < 460){ // Make the shadow appear when we are above the menu at the bottom
						
						game.objects[i].x = (gridSnapPositionOriginX * 30) - 20;
						game.objects[i].y = (gridSnapPositionOriginY * 30) - 25;
						//game.log('Tower placement grid snap shadow X: ' + game.objects[i].x);
					}
					else{
						game.objects[i].x = -100; // Make this hidden
						game.objects[i].y = -100; // Make this hidden
					}
				}
			}


			// Use this as the potentialTowerPlacementPosition, which should snap to the towerPlacementGrid
			// Later, we will color-code the potentialTowerPlacementPosition to indicate whether it is a legal play
		}
	}
}

game.mousedownHandler = function(event){
	game.mousedown = true;
	game.mouseup = false;
	game.log('Cursor coordinates at mousedown: (' + event.pageX + ',' + event.pageY + ')');

	// hitTest, which returns either FALSE, or object
	// Check object for clickability
	if(obj = game.hitTest(event)){
		game.log("Clicked on object " + obj.type)
		if(obj.clickable){
			obj.mousedown();
		}
	}

	//game.log('mousedown dragging context ' + game.DRAGGING_NEW_TOWER + ' and object type is ' + obj.type);
	if(!game.DRAGGING_NEW_TOWER && obj.type === 'towerPickerItem'){
		if(game.cash >= obj.cost){
			var newColor = obj.color;
			newColor = newColor.replace(')',',.25)');
			newColor = newColor.replace('rgb','rgba');

			var newTowerPlacement = {x: event.pageX - 15, y: event.pageY - 15, w: 30, h: 30, cost: obj.cost, range: obj.range, reloadTime: obj.reloadTime, damage: obj.damage, color: newColor, type: 'towerPlacementItem', canvas: 'base_canvas', draw: function(){
				game.ctx.fillStyle = this.color;
				game.ctx.fillRect(this.x, this.y, this.w, this.h);
			}};
			game.addObject(newTowerPlacement);

			game.DRAGGING_NEW_TOWER = true;


			var newTowerPlacementGrid = {x: 0, y: 0, w: 500, h: 460, color: 'rgba(200,200,200,.5)', type: 'towerPlacementGrid', canvas: 'base_canvas', draw: function(){
				game.ctx.fillStyle = this.color;
				for(i = 5; i <= this.h; i+=30){
					// Draw horizontal grid lines
					game.ctx.beginPath();
					game.ctx.moveTo(10,i);
					game.ctx.lineTo(490,i);
					game.ctx.stroke();
				}
				for(i = 10; i <= this.w; i+=30){
					// Draw vertical grid lines
					game.ctx.beginPath();
					game.ctx.moveTo(i,5);
					game.ctx.lineTo(i,455);
					game.ctx.stroke();
				}
				
			}};
			game.addObject(newTowerPlacementGrid);
			game.cash -= obj.cost;
			game.log("Cash reduced to $" + game.cash);
		}
		else{
			game.log("Not enough cash!");
		}

		
		

	}
}

game.mouseupHandler = function(event){
	

	game.log('Cursor coordinates at mouseup: (' + event.pageX + ',' + event.pageY + ')');

	if(game.mouseState === DRAGGING){
		//game.log("Dragged object to (" + game.dragTarget.x + "," + game.dragTarget.y);

		if(game.DRAGGING_NEW_TOWER === true){
			game.log('Finished dragging new tower placement');
			// Place new tower on battlefield
			// Delete tower dragging context
			var towerPlacementItem = game.getObjectByType('towerPlacementItem');
			game.delObjectByType('towerPlacementItem');
			game.delObjectByType('towerPlacementGrid');

			var towerPlacementGridSnapPositionShadow = game.getObjectByType('towerPlacementGridSnapPositionShadow');

			//if(isInsideValidGridSpace(towerPlacementItem)){ // To replace the line below - ensure the placementItem is inside a valid grid space
			if(towerPlacementItem.y + 30 < 460){ // Need to clear the towerPicker bar - later, just see if we are snapping to a gridpoint
				//console.log(towerPlacementItem);
				var towerColor = towerPlacementItem.color;
				towerColor = towerColor.replace('.25','1');
				var newTowerItem = {x: towerPlacementGridSnapPositionShadow.x, y: towerPlacementGridSnapPositionShadow.y, w: 30, h: 30, draw: function(){
						game.ctx.fillStyle = this.color;
						game.ctx.fillRect(this.x, this.y, this.w, this.h);
					},
					canvas: 'base_canvas',
					type: 'towerItem',
					color: towerColor,
					range: towerPlacementItem.range,
					damage: towerPlacementItem.damage,
					timeOfLastDischarge: 0,
					reloadTime: towerPlacementItem.reloadTime,
					weaponReady: function(){
						if(Date.now() >= this.timeOfLastDischarge + (this.reloadTime * 1000)){
							return true;
						}
						return false;
					},
					isCreeperInRange: function(creeper){
						//game.log('Checking if creeper is in range');
						//console.log(creeper);
						if(this.weaponReady()){
							var creeperCenter = {x: creeper.x + (creeper.w / 2), y: creeper.y + (creeper.h / 2)};
							var towerCenter = {x: this.x + 15, y: this.y + 15};

							// Get the distance from the center of the tower to the edge of the creeper (angular distance minus the creeper radius)
							// Use the pythagorean theorem on the X,Y values to get the angular distance

							var yDistance = Math.round(towerCenter.y - creeperCenter.y);
							var xDistance = Math.round(towerCenter.x - creeperCenter.x);
							var rangeDistance = Math.round(Math.sqrt((xDistance * xDistance) + (yDistance * yDistance))) - 2.5;


							if(rangeDistance < this.range && this.weaponReady){
								//game.log('Distance to creeper: ' + rangeDistance);
								//game.log('Creeper is in range! DIE!');
								this.fireWeaponAtCreeper(creeper);
							}
						}
					},
					fireWeaponAtCreeper: function(creeper){

						this.timeOfLastDischarge = Date.now();
						// Instantiate firing weapon animation
						// Instantiate creeper death animation
						// Delete creeper from battlefield
						// Increment score, cash
						creeper.health -= this.damage;
						if(creeper.health <= 0){
							game.delCreeper(creeper);
							game.cash += creeper.cashReward;
							game.score += creeper.scoreReward;
							//game.log("Cash increased to $" + game.cash + ', score is now ' + game.score);
						}
						
					}
				};
				game.addObject(newTowerItem);
				game.updateGrid();
				game.graph = new Graph(game.grid);
				game.start = game.graph.grid[0][8];
				game.end = game.graph.grid[15][8];

				// Using A* algorithm to determine path to finish
				// http://bgrins.github.io/javascript-astar/
				game.path = astar.search(game.graph, game.start, game.end);
			}
		}
	}
	game.mouseup = true;
	game.mousedown = false;
	
	game.mouseState = NONE;
	game.DRAGGING_NEW_TOWER = false;

}


game.drawTowerDragContext = function(){
	//game.log('Dragging tower placement');

	for (var i = 0; i <= game.objects.length - 1; i++) {
		if(game.objects[i].type === 'towerPlacementItem'){
			//game.log('Tower placement item: ');
			//game.log(game.objects[i]);
			game.ctx.fillStyle = game.objects[i].color;
			game.ctx.fillRect(game.objects[i].x, game.objects[i].y, game.objects[i].w, game.objects[i].h);
		}
	}
}

game.drawObjects = function(){

	// Initialize tower picker background
	game.ctx.fillStyle = "rgb(100,100,100)";
	game.ctx.fillRect(0, 460, 500, 40);

	for (var i = 0; i <= game.objects.length - 1; i++) {
		//game.ctx.fillStyle = game.objects[i].color;
		//game.ctx.fillRect(game.objects[i].x, game.objects[i].y, game.objects[i].w, game.objects[i].h);
		game.objects[i].draw();

	}
}

game.drawCreepers = function(){
	// Get the line of progression through the battlefield
	//game.log('Drawing creepers');

	for (var i = 0; i < game.creepers.length; i++) {

		var nextNodePosition = {};

		

		//console.log('Creeper node position x: ' + creeperNodePositionX + ' y:: ' + creeperNodePositionY);


		if(game.creepers[i].x < 40 || game.creepers[i].x >= 460){
			if(!game.paused){
				game.creepers[i].x += game.creepers[i].speed;
			}
		}
		else{

			var creeperLoc = game.graph.grid[Math.floor((game.creepers[i].x - 10)/30)][Math.floor((game.creepers[i].y - 5)/30)];
			var creeperPath = astar.search(game.graph, creeperLoc, game.end);

			//console.log('Should be moving....');

			nextNodePosition.x = ((creeperPath[0].x) * 30) + 15;
			nextNodePosition.y = ((creeperPath[0].y) * 30) + 15;

			//console.log(nextNodePosition);
			//console.log('Changing position of creeper');

			if(!game.paused){
				if(nextNodePosition.x > game.creepers[i].x){
					// Right
					//console.log('moving right');
					game.creepers[i].x += game.creepers[i].speed;
				}
				else if(nextNodePosition.x < game.creepers[i].x){
					// Left
					game.creepers[i].x -= game.creepers[i].speed;
				}

				if(nextNodePosition.y > game.creepers[i].y){
					// Down
					game.creepers[i].y += game.creepers[i].speed;
				}
				else if(nextNodePosition.y < game.creepers[i].y){
					// Up
					game.creepers[i].y -= game.creepers[i].speed;
				}

			}

		}



		game.creepers[i].draw();
		if(game.creepers[i].x > 500){

			game.delCreeper(game.creepers[i]);
			//game.log("One got away!");
			game.lives--;
			if(game.lives > 0){
				//game.log("Lives reduced to " + game.lives);

			}
			else{
				//game.log("Game over! Score was: " + game.score);
				game.ctx.fillStyle = "rgba(255,0,0,1)";
				game.ctx.font="30px Arial";
				game.ctx.fillText("Game Over, Douche!",100,250);
				game.over = true;
			}
		}
		
	}
}


game.releaseCreepers = function(){
	game.wave++;
	//game.log('Releasing creepers');
	// Instantiate the creepers for this "wave"

	var health = 1;
	var color = "rgb(110,110,110)"
	var height = 5;
	var width = 5;
	var speed = 1;
	var cashReward = 2;
	var scoreReward = 100;

	for (var i = 0; i < 10; i++) {
		health = 3;
		color = "rgb(110,110,110)"
		height = 5;
		width = 5;
		speed = 1;
		cashReward = 2;
		scoreReward = 100;

		if(Math.floor((Math.random() * 10) + 1) === 10){
			health = 3;
			color = "rgb(10,10,10)";
			height = 8;
			width = 8;
			speed = .5;
			cashReward = 5;
			scoreReward = 200;
		}

		var newCreeper = {x: (i * -10) - 10, y: 250, w: width, h: height, health: health, color: color, cashReward: cashReward, scoreReward: scoreReward, type: 'towerItem', canvas: 'base_canvas', speed: speed, draw: function(){
			game.ctx.fillStyle = this.color;
			game.ctx.fillRect(this.x, this.y, this.w, this.h);
		}};
		game.addCreeper(newCreeper);
	}
	

	game.lastCreeperRelease = Date.now();
}


game.shootCreepers = function(){
	
	for (var i = game.objects.length - 1; i >= 0; i--) {
		if(game.objects[i].type === 'towerItem'){
			
			
			for (var c = 0; c <= game.creepers.length - 1; c++) {
				//game.log('Trying to shoot creepers');
				game.objects[i].isCreeperInRange(game.creepers[c]);
			}
			
		}
	};

}


game.drawStats = function(){
	game.ctx.font="12px Arial";
	game.ctx.fillStyle = "rgb(255,255,255)";
	game.ctx.fillText("Score: " + game.score, 420, 475);
	game.ctx.fillText("Cash: $" + game.cash, 420, 490);
	game.ctx.fillText("Lives: " + game.lives, 360, 475);
	game.ctx.fillText("Wave: " + game.wave, 360, 490);
}

game.step = function(){

	game.ctx.clearRect(0, 0, game.canvas.width, game.canvas.height);

	if(!game.paused){
		if(Date.now() > (game.lastCreeperRelease + 5000)){
			game.releaseCreepers();
		}
	}

	

	game.drawObjects();
	game.drawCreepers();

	if(!game.paused){
		if(game.creepers.length > 0){
			game.shootCreepers();
		}
	}

	game.drawStats();

	if(game.paused){
		game.ctx.font="26px Arial";
		game.ctx.fillStyle = "rgba(0,0,255,.75)";
		game.ctx.fillText("Game Paused",160,250);
	}

	//game.log('dragging context ' + game.DRAGGING_NEW_TOWER);
	/*
	if(game.DRAGGING_NEW_TOWER){
		game.drawTowerDragContext();
	}*/

	//game.log('Number of objects: ' + game.objects.length);

	//game.log('stepping');
	//setTimeout(function(){window.requestAnimationFrame(game.step)},1000);
	if(!game.over){
		window.requestAnimationFrame(game.step);
	}
}



