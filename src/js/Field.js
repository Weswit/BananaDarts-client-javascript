/*
Copyright 2014 Weswit s.r.l.

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/
define(["./Constants","./Utils"],function(Constants,Utils) {
  
  var WIDTH = window.innerWidth;
  var HEIGHT = window.innerHeight;
  
  var RIGHT = "right";
  var LEFT = "left";
  var CAMERA_POSITIONS = [
                   {x: 0, y: Constants.INITIAL_CAMERA_POS_Y, z:Constants.INITIAL_CAMERA_POS_Z},
                   {x: -Constants.MAX_SIZE.x, y:0, z:0},
                   {x: 0, y:0, z:-Constants.MAX_SIZE.z},
                   {x: Constants.MAX_SIZE.x, y:0, z:0}
                   ];
  
  var SEE_THROUGH_MATERIAL = new THREE.MeshBasicMaterial({color: "black",  blending: THREE.NoBlending, opacity:0});
  
  
  var Field = function(htmlEl) {
     
    this.htmlEl = htmlEl;
    
    this.scene = new THREE.Scene();
    this.cssScene = new THREE.Scene();
    this.group = new THREE.Object3D();
    this.scene.add( this.group );
    
    this.renderer = null;
    this.cssRenderer = null;
    this.camera = null;
    this.controls = null;
    
    
    this.webGLinUse = this.setupRenderers();
    this.setupHtml();
        
    this.setupRoom();

    this.currentCameraPosition = -1;
    this.setupCamera();
    
    this.setupLight();
    
    this.setupBoard();
    
    this.setupSize();
     
    this.render();
    
    var that = this;
    $(window).resize(function(){
      that.setupSize();
    });
  };
  
  /*var cCall = 0;
  var cExe = 0;
  var cChange = 0;
  setInterval(function() {
    console.log(cCall + " - " + cExe + " - " + cChange);
    cExe = cCall = cChange = 0;
  },1000);*/
  
  Field.prototype = {
      
      /**
       * @private
       */
      setupSize: function() {
        WIDTH = window.innerWidth;
        HEIGHT = window.innerHeight;

        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();

        this.renderer.setSize( window.innerWidth, window.innerHeight );
        this.cssRenderer.setSize( window.innerWidth, window.innerHeight );
        
        this.render();
      },
      
      /**
       * @private
       */
      setupRenderers: function() {
        this.cssRenderer = new THREE.CSS3DRenderer();
        
        var webGl = true;
        try { 
          this.setupWebGL();
        } catch (e) { 
          webGl = false;
          this.setupCanvas();
        }
        this.renderer.shadowMapEnabled = true;
        this.renderer.sortObjects = false;
        this.renderer.setClearColor( "black", 1 );
       
        //this.rendererStats  = new THREEx.RendererStats();
        //this.stats = new Stats();
        return webGl;
      },
      
      setupHtml: function() {
        this.cssRenderer.domElement.id = "cssRenderer"; //css is important
        this.htmlEl.appendChild(this.cssRenderer.domElement);
        
        this.renderer.domElement.id = "renderer"; //css is important
        this.cssRenderer.domElement.appendChild(this.renderer.domElement);
        
        /*this.rendererStats.domElement.style.position   = 'absolute';
        this.rendererStats.domElement.style.left  = '0px';
        this.rendererStats.domElement.style.bottom    = '45px';
        this.htmlEl.appendChild( this.rendererStats.domElement );
        
        this.htmlEl.appendChild(this.stats.domElement);*/
      },
      
      /**
       * @private
       */
      setupCamera: function() {
        var v = this.webGLinUse ? 0.1 : 1;
        this.camera = new THREE.PerspectiveCamera( 45, WIDTH/HEIGHT, v, 10000);
        
        this.controls = new THREE.OrbitControls(this.camera, this.htmlEl);
        
        var that = this;
        this.controls.addEventListener('change', function() {
          //cChange++;
          that.render();
          that.cssRender();
        });
        
        this.rotateCamera(0);
        this.render();
      },
      
      /**
       * @private
       */
      setupLight: function() {
        // Lighting the scene.
                
        /*var boardLight = new THREE.DirectionalLight(0xffffff, 3.5);
        boardLight.position.set(0,Constants.MAX_SIZE.y/3.5,-Constants.MAX_SIZE.z/1.5);
        boardLight.target.position.set(0,0,-Constants.MAX_SIZE.z);
        boardLight.shadowCameraLeft = -Constants.BOARD_DIAMETER/2;
        boardLight.shadowCameraRight = Constants.BOARD_DIAMETER/2;//40
        boardLight.shadowCameraTop = Constants.BOARD_DIAMETER/1.3;
        boardLight.shadowCameraBottom = -Constants.BOARD_DIAMETER/2;
        boardLight.shadowCameraNear = Constants.BOARD_DIAMETER/2;
        boardLight.shadowCameraFar = Constants.BOARD_DIAMETER/0.6;
        //boardLight.castShadow = true;
        //boardLight.shadowCameraVisible = true;
        this.scene.add(boardLight);*/
        
        var pLight = new THREE.PointLight(0xffffff, 3.5);
        pLight.position.set(0,Constants.MAX_SIZE.y/2,-Constants.MAX_SIZE.z/1.5);
        this.scene.add(pLight);
        
        /*var pLight2 = new THREE.PointLight(0xffffff, 3.5);
        pLight2.position.set(0,Constants.MAX_SIZE.y/2,Constants.MAX_SIZE.z/1.5);
        this.scene.add(pLight2);*/
        
        var pLightLeft = new THREE.PointLight(0xffffff, 0.5);
        pLightLeft.position.set(-Constants.MAX_SIZE.x,Constants.MAX_SIZE.y/2,Constants.MAX_SIZE.z/1.5);
        this.scene.add(pLightLeft);
        
        var pLightRight = new THREE.PointLight(0xffffff, 0.5);
        pLightRight.position.set(Constants.MAX_SIZE.x,Constants.MAX_SIZE.y/2,Constants.MAX_SIZE.z/1.5);
        this.scene.add(pLightRight);
        
        
        var aboveLight = new THREE.DirectionalLight( 0xFFFFFF, 0.1 );
        aboveLight.position.set(0,Constants.MAX_SIZE.y+1,0); //+1 or else when touching the ceiling the shadow is not shown
        aboveLight.target.position.set(0,-Constants.MAX_SIZE.y,0);
        aboveLight.castShadow = true;
        //aboveLight.shadowCameraVisible = true;
        aboveLight.shadowCameraLeft = -Constants.MAX_SIZE.z-Constants.FLOOR_OVERFLOW;
        aboveLight.shadowCameraTop = -Constants.MAX_SIZE.x;
        aboveLight.shadowCameraRight = Constants.MAX_SIZE.z;
        aboveLight.shadowCameraBottom = Constants.MAX_SIZE.x;
        aboveLight.shadowCameraNear = 0;
        aboveLight.shadowCameraFar = Constants.MAX_SIZE.y*2+2; //+2 or else part of the floor might be out of reach 
        aboveLight.shadowMapWidth = 4096;
        aboveLight.shadowMapHeight = 4096;
        aboveLight.shadowBias = -.001;
        aboveLight.shadowDarkness = .85;
        
      
        
        this.scene.add( aboveLight );
        
      },
      
      /**
       * @private
       */
      setupWebGL: function() {
        this.renderer = new THREE.WebGLRenderer(); 
      },
      
      /**
       * @private
       */
      setupCanvas: function() {
        this.renderer = new THREE.CanvasRenderer();
      },
      
      /**
       * @private
       */
      setupRoom: function() {
        
        //textures
        var floorTexture = THREE.ImageUtils.loadTexture("images/floor.jpg");
        floorTexture.wrapS = floorTexture.wrapT = THREE.RepeatWrapping;
        floorTexture.repeat.set( 8, 5 );
        
        var ceilingTexture = THREE.ImageUtils.loadTexture("images/ceiling.jpg");
        ceilingTexture.wrapS = ceilingTexture.wrapT = THREE.RepeatWrapping;
        ceilingTexture.repeat.set( 4, 3 );
        
        var leftWallTexture = THREE.ImageUtils.loadTexture("images/leftwall.jpg");
        var backWallTexture = THREE.ImageUtils.loadTexture("images/wall.jpg");
        var rightWallTexture = THREE.ImageUtils.loadTexture("images/rightwall.jpg");
     
        //create materials using textures
        var floorMaterial = new THREE.MeshBasicMaterial({map: floorTexture});
        var ceilingMaterial = new THREE.MeshBasicMaterial({ map: ceilingTexture});
        var leftWallMaterial = new THREE.MeshBasicMaterial({ map: leftWallTexture});
        var backWallMaterial =  new THREE.MeshBasicMaterial({ map: backWallTexture});
        var rightWallMaterial = new THREE.MeshBasicMaterial({ map: rightWallTexture});
        
        //prepare geometries
        var sideWallGeometry = new THREE.PlaneGeometry(Constants.MAX_SIZE.z*2+Constants.FLOOR_OVERFLOW,Constants.MAX_SIZE.y*2);
        var floorCeilingGeometry = new THREE.PlaneGeometry(Constants.MAX_SIZE.x*2,Constants.MAX_SIZE.z*2+Constants.FLOOR_OVERFLOW);
        var backWallGeometry = new THREE.PlaneGeometry(Constants.MAX_SIZE.x*2,Constants.MAX_SIZE.y*2);
        
        //put everything together
        var floor = new THREE.Mesh(floorCeilingGeometry,floorMaterial);
        floor.position.set(0,-Constants.MAX_SIZE.y,Constants.FLOOR_OVERFLOW/2);
        floor.rotation.x = Math.PI / -2;
        floor.receiveShadow = true;
        this.group.add(floor);
        
        var ceiling = new THREE.Mesh(floorCeilingGeometry,ceilingMaterial);
        ceiling.position.set(0,Constants.MAX_SIZE.y,Constants.FLOOR_OVERFLOW/2);
        ceiling.rotation.x = Math.PI / 2;
        ceiling.receiveShadow = true;
        this.group.add(ceiling);
                
        var backWall = new THREE.Mesh(backWallGeometry,backWallMaterial);
        backWall.position.set(0,0,-Constants.MAX_SIZE.z);
        backWall.receiveShadow = false;
        this.group.add(backWall);
        
        var leftWall = new THREE.Mesh(sideWallGeometry,leftWallMaterial);
        leftWall.position.set(-Constants.MAX_SIZE.x,0,Constants.FLOOR_OVERFLOW/2);
        leftWall.receiveShadow = false;
        leftWall.rotation.y = Math.PI / 2;
        this.group.add(leftWall);
        
        var rightWall = new THREE.Mesh(sideWallGeometry,rightWallMaterial);
        rightWall.position.set(Constants.MAX_SIZE.x,0,Constants.FLOOR_OVERFLOW/2);
        rightWall.receiveShadow = false;
        rightWall.rotation.y = Math.PI / -2;
        this.group.add(rightWall);
        
      },
      
      /**
       * @private
       */
      setupBoard: function() {
        var that = this;
        
        Utils.loadObj("obj/dartboard.obj", "obj/dartboard.obj.mtl", function (object) {
          object.position.set(0,Constants.CENTER_Y,-(Constants.MAX_SIZE.z));
          object.scale.set(Constants.SCALE,Constants.SCALE,Constants.SCALE);
          object.quaternion.set(0,1,0,0);
          
          that.group.add( object );
          that.render();
        });

      },
      
///////////////////---> end initialization code
      getSeeThroughMaterial: function() {
        return SEE_THROUGH_MATERIAL;
      },
      
      isWebGLinUse: function() {
        return this.webGLinUse;
      },

      render: function() {
        //cCall++;
        if (this.waitingToRender) {
          return;
        }
        this.waitingToRender = true;
        var that = this;
        requestAnimationFrame(function() {
          //cExe++;
          that.waitingToRender = false;
          if (that.controls.enabled) {
            that.controls.update();
          }
          that.renderer.render(that.scene, that.camera); 
          //that.rendererStats.update(that.renderer);
          //that.stats.update();
          if (that.waitingToRenderCSS) {
            that.cssRenderer.render(that.cssScene, that.camera);
            that.waitingToRenderCSS = false;
          }
        });
      },
      
      cssRender: function() {
        this.waitingToRenderCSS = true;
        this.render();
      },
      
      rotateCamera: function(dir) {
       
        if (dir == RIGHT) {
          this.currentCameraPosition--;
        } else if (dir == LEFT) {
          this.currentCameraPosition++;
        } else {
          this.currentCameraPosition = dir;
        }
        
       
        if (this.currentCameraPosition >= CAMERA_POSITIONS.length) {
          this.currentCameraPosition = 0;
        } else if(this.currentCameraPosition < 0) {
          this.currentCameraPosition = CAMERA_POSITIONS.length-1;
        }
        
        
        this.moveCamera(CAMERA_POSITIONS[this.currentCameraPosition].x,CAMERA_POSITIONS[this.currentCameraPosition].y,CAMERA_POSITIONS[this.currentCameraPosition].z);
        this.pointCamera(0,Constants.INITIAL_CAMERA_POS_Y,0);
      },
      
      moveCamera: function(x,y,z) {
        this.camera.position.set(x,y,z);
        this.render();
        this.cssRender();
      },
      
      pointCamera: function(x,y,z) {
        this.camera.lookAt( {x:x,y:y,z:z} );
        this.controls.target.set(x,y,z);
        this.render();
        this.cssRender();
      },
      
      enableOrbit: function(enabled) {
        this.controls.enabled = enabled;
      },
      
      addObject: function(obj) {
        this.group.add(obj);
        this.render();
      },
      
      removeObject: function(obj) {
        this.group.remove(obj);
        this.render();
      },
      
      addCSSObject: function(obj) {
        this.cssScene.add(obj);
        this.cssRender();
      },
      
      removeCSSObject: function(obj) {
        this.cssScene.remove(obj);
        this.cssRender();
      }
  };
  
  return Field;
  
});