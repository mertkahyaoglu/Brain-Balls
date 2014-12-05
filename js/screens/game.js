GameStates.Game = {

	init: function(level, score) {
		this.level = level;
		this.prevscore = score;
	},
	
	create: function() {
		this.setupWorld();
		this.setupLevel();
	},

	setupWorld: function() {
		this.add.sprite(0, 0, 'bg');
		var panel = this.add.sprite(0, 0, 'panel');
		var notificationText = this.add.text(10, panel.height/2, "Ready!", { font: "30px Concert One", fill: "#fff"});
		notificationText.anchor.setTo(0.5, 0.5);
		var level = this.add.sprite(this.world.width -  this.cache.getImage("level").width / 2, 0, 'level');
		level.anchor.setTo(0.5, 0);
		var lvText = this.add.text(level.x, level.y, this.level+1, { font: "36px Concert One", fill: "#fff"});
		lvText.anchor.setTo(0.5, 0);
		this.timer = this.add.sprite(this.world.centerX, this.world.height, "timer");
		this.timer.anchor.setTo(0.5, 1);
		this.timerRatio = (this.world.height - this.cache.getImage("panel").height) / this.timer.height;

		//variables
		this.timeIsOut = false;
		this.finish = false;
		this.balls = undefined;
		this.sequence = [];
		this.playerSequence = [];
		this.NUM_BALLS = 0;
		this.picks = 0;
	},

	setupLevel: function() {
		var level = this.cache.getJSON('levels').levels[this.level];
		//setup balls
		this.timerMilliseconds = level.time;
		this.animationDuration = level.duration;
		this.NUM_BALLS = level.num_balls;
		this.picks = this.NUM_BALLS;
		this.balls = this.add.group();
	    for (var i = 0, ball; i < this.NUM_BALLS; i++) {
	        ball = this.balls.create(level.balls_position[i].x, level.balls_position[i].y, 'ball_idle');
	        ball.anchor.setTo(0.5, 0.5);
	    }

	    //setup sequence
	    this.createRandomSequnce();
	    this.animateSequence();
	},

	onBallSelect: function(ball, pointer) {
		ball.loadTexture('ball_select', 0);
		this.playerSequence.push(this.balls.getIndex(ball));
		this.picks--;
	},

	createRandomSequnce: function () {
		var rndSequnce = [];
		for (var i = 0; i < this.NUM_BALLS; i++) rndSequnce.push(i);
    	this.sequence = this.math.shuffleArray(rndSequnce);
	},

	animateSequence: function() {
		var game = this;
		setTimeout(function(){
			for (var i = 0; i < game.NUM_BALLS; i++) {
	    		var ball = game.balls.getAt(game.sequence[i]);
	    		var ballTween = game.add.tween(ball.scale).to( {x: 1.3, y: 1.3}, game.animationDuration, Phaser.Easing.Back.InOut, true, i * game.animationDuration, false).to( {x: 1, y: 1}, game.animationDuration, Phaser.Easing.Back.InOut, true, false);
	    		if (i == game.NUM_BALLS - 1)
	    			ballTween.onComplete.addOnce(game.startGame, game);
	    	}
		}, 1000);
	},

	startGame: function() {
		for (var i = 0; i < this.NUM_BALLS; i++) {
			var ball = this.balls.getAt(this.sequence[i]);
			ball.inputEnabled = true;
		    ball.input.start(0, true);
		    ball.events.onInputDown.addOnce(this.onBallSelect.bind(this));
		}
		this.startTime = this.time.now;
		this.timerTween = this.add.tween(this.timer.scale).to( {x: 1, y: this.timerRatio}, this.timerMilliseconds, Phaser.Easing.None, true, 500, false);
		this.timerTween.onComplete.addOnce(this.timeOut, this);
	},

	timeOut: function() {
		this.timeIsOut = true;
	},

	getMatches: function() {
		var matches = [];
		for (var i = 0; i < this.NUM_BALLS; i++) {
			if (this.sequence[i] == this.playerSequence[i]) matches.push(1);
			else matches.push(0);
		};
		return matches;
	},

	update: function () {
		if (!this.finish) {
			this.score = this.math.floor((this.time.now - this.startTime) / 1000);
		}
		if (this.picks <= 0) {
			this.finish = true;
			this.timerTween.stop();
			var result = "GameWin";
			for (var i = 0, matches = this.getMatches(), len = matches.length; i < len; i++) {
				if (matches[i] == 1) {
					this.balls.getAt(i).loadTexture('ball_true', 0);
				}
				else {
					this.balls.getAt(i).loadTexture('ball_false', 0);
					result = "GameOver";
				}
			}
			var game = this;
			setTimeout(function() {
				game.state.start(result, true, false, game.level, game.score+game.prevscore);
			}, 1000);
		}
		if (this.timeIsOut) {
			this.finish = true;
			for (var i = 0; i < this.NUM_BALLS; i++) {
				this.balls.getAt(i).inputEnabled = false;				
			}
			var game = this;
			setTimeout(function() {
				console.log("Time is out");
				game.state.start("GameOver", true, false, game.level, game.score+game.prevscore);
			}, 1000);
		}
	}

}
