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
		break;
		case 'blue':
			towerColor = "rgb(0,0,200)";
		break;
		case 'red':
			towerColor = "rgb(200,0,0)";
		break;
	}

	var mousedownaction = function(){
		console.log('Mouse down over a tower!');
	}
	var newTower = {x: (40 * (game.towerPickerItems.length + 1)), y: 465, w: 30, h: 30, cost: 30, color: towerColor, type: 'towerPickerItem', canvas: 'base_canvas', draggable: true, clickable: true, mousedown: mousedownaction, draw: function(){
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

			var newTowerPlacement = {x: event.pageX - 15, y: event.pageY - 15, w: 30, h: 30, color: newColor, type: 'towerPlacementItem', canvas: 'base_canvas', draw: function(){
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
				var towerColor = towerPlacementItem.color;
				towerColor = towerColor.replace('.25','1');
				var newTowerItem = {x: towerPlacementGridSnapPositionShadow.x, y: towerPlacementGridSnapPositionShadow.y, w: 30, h: 30, color: towerColor, type: 'towerItem', canvas: 'base_canvas', draw: function(){
						game.ctx.fillStyle = this.color;
						game.ctx.fillRect(this.x, this.y, this.w, this.h);
					},
					range: 90,
					timeOfLastDischarge: 0,
					reloadTime: 2,
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
							var creeperCenter = {x: creeper.x + 2.5, y: creeper.y + 2.5};
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
						game.delCreeper(creeper);
						game.cash += 2;
						game.score += 100;
						game.log("Cash increased to $" + game.cash + ', score is now ' + game.score);
					}
				};
				game.addObject(newTowerItem);
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

	for (var i = 0; i <= game.creepers.length - 1; i++) {
		game.creepers[i].x += game.creepers[i].speed;

		if(game.creepers[i].x > 500){
			game.delCreeper(game.creepers[i]);
			//game.log("One got away!");
			game.lives--;
			if(game.lives > 0){
				game.log("Lives reduced to " + game.lives);
			}
			else{
				game.log("Game over! Score was: " + game.score);
				game.over = true;
			}
		}
		game.creepers[i].draw();
	}
}


game.releaseCreepers = function(){
	
	game.log('Releasing creepers');
	// Instantiate the creepers for this "wave"
	for (var i = 0; i < 10; i++) {
		var newCreeper = {x: (i * -10) - 10, y: 250, w: 5, h: 5, color: "rgb(10,10,10)", type: 'towerItem', canvas: 'base_canvas', speed: 1, draw: function(){
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


game.step = function(){

	game.ctx.clearRect(0, 0, game.canvas.width, game.canvas.height);

	if(Date.now() > (game.lastCreeperRelease + 5000)){
		game.releaseCreepers();
	}

	game.drawObjects();
	game.drawCreepers();

	if(game.creepers.length > 0){
		game.shootCreepers();
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



