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

	game.mouseup = true;
	game.mousedown = false;
	game.mouseState = NONE;

	game.DRAGGING_NEW_TOWER = false;

	game.container = document.getElementById('container');

	game.objects = [];
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

	//game.objects.push(obj);
}

game.delObject = function(obj){

	game.objects = game.objects.filter(function(e){
		if(obj === e){
			return false;
		}
		return true;
	});
	
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
	var newTower = {x: (40 * (game.towerPickerItems.length + 1)), y: 465, w: 30, h: 30, color: towerColor, type: 'towerPickerItem', canvas: 'base_canvas', draggable: true, clickable: true, mousedown: mousedownaction, draw: function(){
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
			for (var i = game.objects.length - 1; i >= 0; i--) {
				if(game.objects[i].type === 'towerPlacementItem'){
					game.objects[i].x = event.pageX - 15;
					game.objects[i].y = event.pageY - 15;
				}
			}
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
			game.delObjectByType('towerPlacementItem');
			game.delObjectByType('towerPlacementGrid');
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

	for (var i = game.objects.length - 1; i >= 0; i--) {
		//game.ctx.fillStyle = game.objects[i].color;
		//game.ctx.fillRect(game.objects[i].x, game.objects[i].y, game.objects[i].w, game.objects[i].h);
		game.objects[i].draw();
	}
}

game.step = function(){

	game.ctx.clearRect(0, 0, game.canvas.width, game.canvas.height);

	game.drawObjects();

	//game.log('dragging context ' + game.DRAGGING_NEW_TOWER);
	/*
	if(game.DRAGGING_NEW_TOWER){
		game.drawTowerDragContext();
	}*/

	//game.log('Number of objects: ' + game.objects.length);

	//game.log('stepping');
	//setTimeout(function(){window.requestAnimationFrame(game.step)},1000);
	window.requestAnimationFrame(game.step);
}



