
var gl;
var Timer;
var program;
var model;
var canvas;

var app =
{
	gl: null,
	canvas: null,
	rogram: null,

	uniform: {
		world: null,
		view: null,
		proj: null
	},
	camera : {
		world: glMatrix.mat4.create(),
		view: glMatrix.mat4.create(),
		proj: glMatrix.mat4.create()
	},
	shaders : [],
	mesh: [],
	browser: null,
	loop: null
};

function NewShader(v, f)
{
	var shader  =
	{
		vs : app.gl.createShader(app.gl.VERTEX_SHADER),
		fs : app.gl.createShader(app.gl.FRAGMENT_SHADER),
		vsText : "",
		fsText : ""
	}
	shader.vsText = v;
	shader.fsText = f;

	app.gl.shaderSource(shader.vs, v);
	app.gl.shaderSource(shader.fs, f);

	app.gl.compileShader(shader.vs);
	if(!app.gl.getShaderParameter(shader.vs, app.gl.COMPILE_STATUS))
	{
		console.error('ERROR Compiling vertex shader!', app.gl.getShaderInfoLog(shader.vs));
		return;
	}
	app.gl.compileShader(shader.fs);
	if(!app.gl.getShaderParameter(shader.fs, app.gl.COMPILE_STATUS))
	{
		console.error('ERROR Compiling fragment shader!', app.gl.getShaderInfoLog(shader.fs));
		return;
	}


	return shader;
}


var loadTextResource = function(url, callback)
{
	var request = new XMLHttpRequest();
	request.open('GET', url + '?please-dont-cache=' + Math.random(), true);
	request.onload = function ()
	{
		if(request.status < 200 || request.status > 299)
		{
			callback('Error : HTTP Status ' + request.status + ' on resource ' + url);
		}
		else
		{
			callback(null, request.responseText);
		}
	};
	request.send();
};

var loadImage = function (url, callback)
{
	var image = new Image();
	image.onload = function() {
		callback(null, image);
	};
	image.src = url;
};

var loadJSONResource = function ( url, callback)
{
	loadTextResource(url, function(err, result)
	{
		if(err)
		{
			callback(err);
		}
		else
		{
			try 
			{
				callback(null, JSON.parse(result));

			}
			catch(e) 
			{
				callback(e);
			}
		}
	});

};

function GetBrowser()
{
	if ( (navigator.appName == 'Netscape' &&
	 navigator.userAgent.search('Trident') != -1) ||
	  (navigator.userAgent.toLowerCase().indexOf("msie") != -1) ){
		//IE
		return false;
	}
	return true;
}

var InitDemo = function()
{
	app.browser = GetBrowser();
 	loadTextResource('/shader.vs.glsl', function(vsErr, vsText)
 	{
 		if(vsErr)
 		{
 			alert('Fatal error getting vertex shader (see console)');
 			console.error(vsErr);
 		}
 		else
 		{
 			loadTextResource('/shader.fs.glsl', function(fsErr, fsText)
 			{
 				if(fsErr)
 				{
 					alert('Fatal error getting fragment shader (see console)');
 					console.error(fsErr);
 				}
 				else
 				{
		 			Initialize(vsText, fsText);
 				}
 			});
 		}
 	});
};

function newStaticMesh(meshPath, imgPath)
{
	loadJSONResource(meshPath, function(modelErr, mesh)
	{
		if(modelErr)
		{
			alert('Fatal error getting model (see console)');
			console.error(modelErr);
		}
		else
		{
			loadImage(imgPath, function(imgErr, img)
			{
				if(imgErr)
				{
					alert('Fatal error gettimg img (see console)');
					console.error(imgErr);
				}
				else
				{
					app.mesh.push(StaticMesh(mesh, img));
					loop();
					///Camera();
				}
			});
		}
	});
}

function StaticMesh(model, img)
{

	var mesh = {
		texture: app.gl.createTexture(),
		indices: [],


		Draw: function(trans)
		{
			var uniform = app.gl.getUniformLocation(app.program, 'mWorld');
			var world = glMatrix.mat4.create();
			glMatrix.mat4.identity(world);
			glMatrix.mat4.rotate(world, world, 90, [1,0,0]);
			glMatrix.mat4.rotate(world, world, -180, [0,1,0]);
			glMatrix.mat4.translate(world, world, [trans,0,0]);
			app.gl.uniformMatrix4fv(uniform, app.gl.FALSE, world);
			app.gl.drawElements(app.gl.TRIANGLES, this.indices.length, app.gl.UNSIGNED_SHORT, 0);
			app.gl.bindTexture(app.gl.TEXTURE_2D, this.texture);
			app.gl.activeTexture(app.gl.TEXTURE0);
		}
	}

	var tempVertices = model.meshes[0].vertices;
	mesh.indices = [].concat.apply([], model.meshes[0].faces);
	var tempTexCoords = model.meshes[0].texturecoords[0];

	var tempPosVertexBufferObject = app.gl.createBuffer();
	app.gl.bindBuffer(app.gl.ARRAY_BUFFER, tempPosVertexBufferObject);
	app.gl.bufferData(app.gl.ARRAY_BUFFER, new Float32Array(tempVertices), app.gl.STATIC_DRAW);

	var tempTexCoordVertexBufferObject = app.gl.createBuffer();
	app.gl.bindBuffer(app.gl.ARRAY_BUFFER, tempTexCoordVertexBufferObject);
	app.gl.bufferData(app.gl.ARRAY_BUFFER, new Float32Array(tempTexCoords), app.gl.STATIC_DRAW);

	var tempIndexBufferObject = app.gl.createBuffer();
	app.gl.bindBuffer(app.gl.ELEMENT_ARRAY_BUFFER, tempIndexBufferObject);
	app.gl.bufferData(app.gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(mesh.indices), app.gl.STATIC_DRAW);

	app.gl.bindBuffer(app.gl.ARRAY_BUFFER, tempPosVertexBufferObject);
	var positionAttribLocation = app.gl.getAttribLocation(app.program, 'vertPosition');
	app.gl.vertexAttribPointer(
		positionAttribLocation,
		3, 
		app.gl.FLOAT,
		app.gl.FALSE,
		3 * Float32Array.BYTES_PER_ELEMENT,
		0);
	app.gl.enableVertexAttribArray(positionAttribLocation);

	app.gl.bindBuffer(app.gl.ARRAY_BUFFER, tempTexCoordVertexBufferObject);
	var texCoordAttribLocation = app.gl.getAttribLocation(app.program, 'vertTexCoord');
	app.gl.vertexAttribPointer(
		texCoordAttribLocation,
		2, 
		app.gl.FLOAT,
		app.gl.FALSE,
		2 * Float32Array.BYTES_PER_ELEMENT,
		0 * Float32Array.BYTES_PER_ELEMENT);

	app.gl.enableVertexAttribArray(texCoordAttribLocation);

	app.gl.bindTexture(app.gl.TEXTURE_2D, mesh.texture);
	app.gl.pixelStorei(app.gl.UNPACK_FLIP_Y_WEBGL, true);
	app.gl.texParameteri(app.gl.TEXTURE_2D, app.gl.TEXTURE_WRAP_S, app.gl.CLAMP_TO_EDGE);
	app.gl.texParameteri(app.gl.TEXTURE_2D, app.gl.TEXTURE_WRAP_T, app.gl.CLAMP_TO_EDGE);
	app.gl.texParameteri(app.gl.TEXTURE_2D, app.gl.TEXTURE_MIN_FILTER, app.gl.LINEAR);
	app.gl.texParameteri(app.gl.TEXTURE_2D, app.gl.TEXTURE_MAG_FILTER, app.gl.LINEAR);

	app.gl.texImage2D(app.gl.TEXTURE_2D, 0, app.gl.RGBA, app.gl.RGBA, app.gl.UNSIGNED_BYTE,	img);

	app.gl.bindTexture(app.gl.TEXTURE_2D, null);

	app.gl.useProgram(app.program);

	return mesh;

}

var Initialize = function(vsText, fsText)
{
	console.log('this is working');

	app.canvas = document.getElementById('game-surface');
	app.gl =app.canvas.getContext('webgl');

	if(!app.gl)  {
		console.log('Webapp.GL not supported, falling back on Experimental')
		app.gl = app.canvas.getContext('experimental-webgl');
	}	

	if(!app.gl)
	{
		alert('Your browser does not support WebGL');
	}

	Reset();

	app.gl.viewport(0, 0, app.canvas.width, app.canvas.height);
	app.gl.enable(app.gl.DEPTH_TEST);
	app.gl.enable(app.gl.CULL_FACE);
	app.gl.frontFace(app.gl.CCW);
	app.gl.cullFace(app.gl.BACK);

	//add Shader
 	app.shaders.push(NewShader(vsText, fsText));

	app.program = app.gl.createProgram();
	app.gl.attachShader(app.program, app.shaders[0].vs);
	app.gl.attachShader(app.program, app.shaders[0].fs);
	app.gl.linkProgram(app.program);

	if(!app.gl.getProgramParameter(app.program, app.gl.LINK_STATUS))
	{
		console.error('ERROR linking app.program!', app.gl.getProgramInfoLog(app.program));
		return;
	}

	app.gl.validateProgram(app.program);
	if(!app.gl.getProgramParameter(app.program, app.gl.VALIDATE_STATUS))
	{
		console.error('ERROR validating app.program!', app.gl.getProgramInfoLog(app.program));
		return;

	}
	newStaticMesh('/susan.json', '/susantexture.png');

};


(function(){
	document.addEventListener("mousemove", function(e){
		var rect = app.canvas.getBoundingClientRect();
		var px = (e.clientX - rect.left) * app.canvas.width / app.canvas.width;
		var py = (e.clientY - rect.top) * app.canvas.height / app.canvas.height;

		if(e.clientX >= rect.left && e.clientX <= rect.width &&
			e.clientY >= rect.top && e.clientY <= rect.height)
		{
			console.log("canvas in " + app.canvas.id);
		}
		//console.log("x = " + e.clientX + ", y = "+e.clientY);
		//console.log("x = " + px + ", y = "+py);
	});

	document.addEventListener("mousedown", function(e){
		var rect = app.canvas.getBoundingClientRect();
		var px = (e.clientX - rect.left) * app.canvas.width / app.canvas.width;
		var py = (e.clientY - rect.top) * app.canvas.height / app.canvas.height;

		if(e.clientX >= rect.left && e.clientX <= rect.width &&
			e.clientY >= rect.top && e.clientY <= rect.height)
		{
			console.log("click in canvas id" + app.canvas.id);
		}
		else
		{
			console.log("click not canvas id" + app.canvas.id);

		}
		//console.log("x = " + e.clientX + ", y = "+e.clientY);
		//console.log("x = " + px + ", y = "+py);
	});
  document.addEventListener('keydown', function(e){
    const keyCode = e.keyCode;
    console.log('pushed key ' + e.key);
    if(keyCode == 13){ // Enter key
		cancelAnimationFrame(app.loop);
   		newStaticMesh('/susan.json', '/susantexture.png');
      	//document.dispatchEvent(new KeyboardEvent('keydown', {key: 'e'}));
      // document.dispatchEvent(new KeyboardEvent('keyup', {key: 'e'}));
    } else if(keyCode == 9){ // Tab key
      //document.dispatchEvent(new KeyboardEvent('keydown', {key: 't'}));
      // document.dispatchEvent(new KeyboardEvent('keyup', {key: 't'}));
    }
  })
})();

function CreateText2D()
{
	return document.getElementById("text").getContext("2d");
}

function DrawText2D(ctx, str, align, font, width, height)
{
	ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
	ctx.textAlign = align;
	ctx.font = font;
	var h = ctx.font.indexOf("px");
	var s = ctx.font.substring(0, h);
	if(app.browser)
	{
		ctx.fillText(str, width, height + Number.parseInt(s));
	}
	else
	{
		ctx.fillText(str, width, height + Number(s));
	}
}

function Camera()
{
	app.uniform.world = app.gl.getUniformLocation(app.program, 'mWorld');
	app.uniform.view = app.gl.getUniformLocation(app.program, 'mView');
	app.uniform.proj = app.gl.getUniformLocation(app.program, 'mProj');


	glMatrix.mat4.identity(app.camera.world);
	glMatrix.mat4.lookAt(app.camera.view, [0,0,-50],[0,0,0],[0,1,0]);
	glMatrix.mat4.perspective(app.camera.proj, glMatrix.glMatrix.toRadian(45),
	 app.canvas.width / app.canvas.height, 0.1,1000.0);

	app.gl.uniformMatrix4fv(app.uniform.world, app.gl.FALSE, app.camera.world);
	app.gl.uniformMatrix4fv(app.uniform.view, app.gl.FALSE, app.camera.view);
	app.gl.uniformMatrix4fv(app.uniform.proj, app.gl.FALSE, app.camera.proj);

	//loop();
}

function UpdateApp()
{
	Tick();
	FramePerSecond();
}

function Draw()
{
	app.gl.clearColor(0.75, 0.85, 0.8, 1.0);
	app.gl.clear(app.gl.DEPTH_BUFFER_BIT | app.gl.COLOR_BUFFER_BIT);

	for(var i = 0;i<app.mesh.length;i++)
	{
		app.mesh[i].Draw(i);
	}
}

function loop()
{
	UpdateApp();
	Camera();
	Draw();

	app.loop = requestAnimationFrame(loop);
}

function MouseMove(e)
{
}