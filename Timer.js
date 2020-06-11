

var deltatime = 0.0;
var secondsPerCount = 0.001;

var baseTime = 0;
var pausedTime = 0;
var stopTime = 0;
var prevTime = 0;
var currTime = 0;

var stopped = false;

var ctx;

var TotalTime = function()
{
	return ((currTime - pausedTime) - baseTime)*secondsPerCount;
};

var Tick = function()
{
	if(stopped)
	{
		deltatime = 0.0;
		return;
	}

	var time = performance.now();
	currTime = time;

	deltatime = (currTime - prevTime) * secondsPerCount;
	//console.log('currTime = ', currTime, ' prevTime = ', prevTime, 'sub = ', currTime - prevTime);
	//console.log(deltatime);
	prevTime = currTime;

	if(deltatime < 0.0)
	{
		deltatime = 0;
	}
};

var Start = function()
{
	var startTime = performance.now();

	if(stopped)
	{
		pausedTime += (startTime - stopTime);

		prevTime = startTime;
		stopTime = 0;
		stopped	 = false;
	}
};

var Stop = function	()
{
	if(!stopped)
	{
		var time = performance.now();

		stopTime = time;
		stopped = true;

	}
};

var Reset = function()
{
	var time = performance.now();

	baseTime = time;
	prevTime = time;
	stopTime = 0;
	stopped	 = false;

	ctx = CreateText2D();
};

var frame = 0;
var timeElapsed = 0.00000;

var FramePerSecond = function()
{
	frame++;

	var t = TotalTime() - timeElapsed;

	if(t >= 1.0)
	{
		var mfps = frame/t;
		DrawText2D(ctx, "fps :" + frame, "right", "20px monospace", ctx.canvas.width, 0);
		frame = 0;
		timeElapsed += 1.0;

	}
};