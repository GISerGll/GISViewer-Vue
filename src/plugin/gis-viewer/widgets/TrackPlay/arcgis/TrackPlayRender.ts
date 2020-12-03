import {geometry} from '@turf/helpers';
import {loadModules} from 'esri-loader';
import * as THREE from 'three';
// @ts-ignore
import {MTLLoader, OBJLoader} from 'three-obj-mtl-loader'

import {GetSpeed} from './distance';

export default class TrackPlayRender {
  private view: any;
  private renderer: any; // three.js renderer
  private camera: any; // three.js camera
  private scene: any; // three.js scene

  private ambient: any; // three.js ambient light source
  private sun: any; // three.js sun light source
  private start: boolean = false;
  private iss: any; // ISS model
  private issScale: number = 1; // scale for the iss model
  private issMaterial: any = new THREE.MeshLambertMaterial({color: 0x696969}); // material for the ISS model

  private paths: any[] = new Array();
  private trackLine: any;

  private cameraPositionInitialized: boolean = false; // we focus the this.view on the ISS once we receive our first data point
  private positionHistory: any[] = new Array(); // all ISS positions received so far
  private trackPoints: any[] = new Array(); // all ISS positions received so far
  private globalIndex: number = 0;

  private markerMaterial: any; // material for the markers left by the ISS
  private markerGeometry: any; // geometry for the markers left by the ISS
  private test: any;
  private speedText: any;
  private font: any;
  private region: any;
  private cylinder: any;
  private dataResults: any[] = new Array();

  private lastPosition: any;
  private lastTime: any;
  private RenderTime: any;
  private lastEntry: any;
  private graphicsLayer: any;
  private tiltAngle: number = 0;
  private external: any;

  public constructor(
    view: __esri.SceneView,
    trackPoints: any[],
    options?: any
  ) {
    this.view = view;
    this.dataResults = trackPoints;
  }

  // Called once a custom layer is added to the map.layers collection and this layer this.view is instantiated.
  public async setup(context: any) {
    const [
      GraphicsLayer,
      externalRenderers,
      SpatialReference,
      Graphic
    ] = await loadModules([
      'esri/layers/GraphicsLayer',
      'esri/views/3d/externalRenderers',
      'esri/geometry/SpatialReference',
      'esri/Graphic'
    ]);

    this.external = [
      GraphicsLayer,
      externalRenderers,
      SpatialReference,
      Graphic
    ];
    let _this = this;
    this.graphicsLayer = new GraphicsLayer();
    this.view.map.add(this.graphicsLayer);
    this.view.watch('camera', (handle: any) => {
      _this.tiltAngle = handle.tilt;
    });

    // initialize the three.js renderer
    //////////////////////////////////////////////////////////////////////////////////////
    this.renderer = new THREE.WebGLRenderer({
      context: context.gl,
      premultipliedAlpha: false
    });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setViewport(0, 0, this.view.width, this.view.height);

    // prevent three.js from clearing the buffers provided by the ArcGIS JS API.
    this.renderer.autoClearDepth = false;
    this.renderer.autoClearStencil = false;
    this.renderer.autoClearColor = false;

    // The ArcGIS JS API renders to custom offscreen buffers, and not to the default framebuffers.
    // We have to inject this bit of code into the three.js runtime in order for it to bind those
    // buffers instead of the default ones.
    let originalSetRenderTarget = this.renderer.setRenderTarget.bind(
      this.renderer
    );
    this.renderer.setRenderTarget = (target: any) => {
      originalSetRenderTarget(target);
      if (target == null) {
        context.bindRenderTarget();
      }
    };

    // setup the three.js scene
    ///////////////////////////////////////////////////////////////////////////////////////

    this.scene = new THREE.Scene();

    // setup the camera
    this.camera = new THREE.PerspectiveCamera();

    // setup scene lighting
    this.ambient = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(this.ambient);
    this.sun = new THREE.DirectionalLight(0xffffff, 0.5);
    this.scene.add(this.sun);

    // setup markers
    this.markerGeometry = new THREE.SphereBufferGeometry(1000, 16, 16);
    this.markerMaterial = new THREE.MeshBasicMaterial({
      color: 0xe03110,
      transparent: true,
      opacity: 0.75
    });

    // load ISS mesh
    let issMeshUrl = 'obj/obj.obj';
    let loader = new OBJLoader(THREE.DefaultLoadingManager);
    loader.load(
      issMeshUrl,
      (object3d: any) => {
        console.log('ISS mesh loaded.');
        _this.iss = object3d;

        // apply ISS material to all nodes in the geometry
        _this.iss.traverse((child: any) => {
          if (child instanceof THREE.Mesh) {
            child.material = _this.issMaterial;
          }
        });

        // set the specified scale for the model
        _this.iss.scale.set(_this.issScale, _this.issScale, _this.issScale);
        // add the model
        _this.scene.add(_this.iss);
        let posEst = [121.311, 31.315, 100];
        let isstransform = _this.iss.modelViewMatrix;
        isstransform.fromArray(
          externalRenderers.renderCoordinateTransformAt(
            _this.view,
            posEst,
            SpatialReference.WGS84,
            new Array(16)
          )
        );
        isstransform.decompose(
          _this.iss.position,
          _this.iss.quaternion,
          new THREE.Vector3(_this.issScale, _this.issScale, _this.issScale)
        );

        let renderPos = [0, 0, 0];
        externalRenderers.toRenderCoordinates(
          _this.view,
          posEst,
          0,
          SpatialReference.WGS84,
          renderPos,
          0,
          1
        );
        _this.iss.position.set(renderPos[0], renderPos[1], renderPos[2]);
        _this.iss.rotateX(Math.PI / 2);

        _this.iss.rotateY(((180 - 80) * Math.PI) / 180);

        _this.speedText = new Graphic({
          geometry: {
            type: 'point', // autocasts as new Point()
            x: posEst[0],
            y: posEst[1],
            z: 1010
          },
          symbol: {
            type: 'label-3d', // autocasts as new LabelSymbol3D()
            symbolLayers: [
              {
                type: 'text', // autocasts as new TextSymbol3DLayer()
                material: {color: [49, 163, 84]},
                size: 12 // points
              }
            ]
          }
        });

        _this.view.graphics.add(_this.speedText);
      },
      undefined,
      (error: any) => {
        console.error('Error loading ISS mesh. ', error);
      }
    );

    // let loader2 = new THREE.FontLoader();
    // loader2.load(
    //   'font/Song_Regular.json',
    //   (font: any) => {
    //     console.log('Font mesh loaded.');
    //     _this.font = font;
    //     let geometry = new THREE.TextGeometry('车速：0.0km/h', {
    //       font: _this.font,
    //       size: 15,
    //       height: 1,
    //       curveSegments: 50,
    //       bevelEnabled: true,
    //       bevelThickness: 2,
    //       bevelSize: 1.0,
    //       bevelOffset: 10,
    //       bevelSegments: 1
    //     });
    //     _this.speedText = new THREE.Mesh(
    //       geometry,
    //       new THREE.MeshBasicMaterial({color: 0x00ff00})
    //     );
    //     _this.scene.add(_this.speedText);
    //   },
    //   undefined,
    //   (error: any) => {
    //     console.error('Error loading Font mesh. ', error);
    //   }
    // );

    // create the horizon model
    let mat = new THREE.MeshBasicMaterial({color: 0x2194ce});
    mat.transparent = true;
    mat.opacity = 0.5;
    this.region = new THREE.Mesh(
      new THREE.TorusBufferGeometry(380, 20, 16, 64),
      mat
    );
    this.scene.add(this.region);

    let material = new THREE.MeshBasicMaterial({color: 0x2194ce});
    this.cylinder = new THREE.Mesh(
      new THREE.ConeGeometry(25, 81, 32),
      material
    );
    this.scene.add(this.cylinder);

    // start querying the ISS position
    this.queryISSPosition();

    // cleanup after ourselfs
    context.resetWebGLState();
  }

  private updateGroupGeometry(mesh: any, geometry: any) {
    // these do not update nicely together if shared
  }
  // Called every time a frame is rendered.
  public async render(context: any) {
    // update camera parameters
    ///////////////////////////////////////////////////////////////////////////////////
    const [externalRenderers, SpatialReference, Graphic] = [
      this.external[1],
      this.external[2],
      this.external[3]
    ];

    let cam = context.camera;

    this.camera.position.set(cam.eye[0], cam.eye[1], cam.eye[2]);
    this.camera.up.set(cam.up[0], cam.up[1], cam.up[2]);
    this.camera.lookAt(
      new THREE.Vector3(cam.center[0], cam.center[1], cam.center[2])
    );

    // Projection matrix can be copied directly
    this.camera.projectionMatrix.fromArray(cam.projectionMatrix);

    // update ISS and region position
    ///////////////////////////////////////////////////////////////////////////////////
    let posEst = [0, 0, 0];
    if (this.iss) {
      let newPos = this.computeISSPosition();
      posEst = newPos.pos;

      let angle = newPos.angle;
      let speed = newPos.speed;
      posEst = [posEst[0], posEst[1], 10];

      let renderPos = [0, 0, 0];
      externalRenderers.toRenderCoordinates(
        this.view,
        posEst,
        0,
        SpatialReference.WGS84,
        renderPos,
        0,
        1
      );
      let line = this.paths.concat();
      this.paths.push(
        new THREE.Vector3(renderPos[0], renderPos[1], renderPos[2])
      );
      // for the region, we position a torus slightly under ground
      // the torus also needs to be rotated to lie flat on the ground

      let transform = new THREE.Matrix4();
      transform.fromArray(
        externalRenderers.renderCoordinateTransformAt(
          this.view,
          posEst,
          SpatialReference.WGS84,
          new Array(16)
        )
      );
      transform.decompose(
        this.region.position,
        this.region.quaternion,
        this.region.scale
      );

      let cytransform = new THREE.Matrix4();
      cytransform.fromArray(
        externalRenderers.renderCoordinateTransformAt(
          this.view,
          [posEst[0], posEst[1], 140],
          SpatialReference.WGS84,
          new Array(16)
        )
      );
      cytransform.decompose(
        this.cylinder.position,
        this.cylinder.quaternion,
        this.cylinder.scale
      );
      this.cylinder.rotateX(Math.PI / 2);

      let txttransform = new THREE.Matrix4();
      txttransform.fromArray(
        externalRenderers.renderCoordinateTransformAt(
          this.view,
          [posEst[0], posEst[1], 200],
          SpatialReference.WGS84,
          new Array(16)
        )
      );
      if (this.speedText) {
        // txttransform.decompose(
        //   this.speedText.position,
        //   this.speedText.quaternion,
        //   this.speedText.scale
        // );
        // if (this.tiltAngle > 20) {
        //   this.speedText.rotateX(Math.PI / 2);
        //   this.speedText.rotateY(((360 - angle) * Math.PI) / 180);
        // } else {
        //   this.speedText.rotateZ(((360 - angle) * Math.PI) / 180);
        //   this.speedText.translateOnAxis(new THREE.Vector3(0, 1, 0), 10);
        // }
        // this.speedText.translateOnAxis(new THREE.Vector3(1, 0, 0), -50);
      }
      let isstransform = this.iss.modelViewMatrix;
      isstransform.fromArray(
        externalRenderers.renderCoordinateTransformAt(
          this.view,
          posEst,
          SpatialReference.WGS84,
          new Array(16)
        )
      );
      isstransform.decompose(
        this.iss.position,
        this.iss.quaternion,
        new THREE.Vector3(this.issScale, this.issScale, this.issScale)
      );
      this.iss.position.set(renderPos[0], renderPos[1], renderPos[2]);
      this.iss.rotateX(Math.PI / 2);

      this.iss.rotateY(((180 - angle) * Math.PI) / 180);

      if (!this.cameraPositionInitialized) {
        this.cameraPositionInitialized = true;
        this.view.goTo(
          {
            center: [posEst[0], posEst[1]],
            zoom: 16,
            tilt: 70
          },
          {animate: false, duration: 3000}
        );
        console.log('1');
      }
      this.scene.remove(this.trackLine);
      let geometry = new THREE.Geometry();
      // 给空白几何体添加点信息，这里写3个点，geometry会把这些点自动组合成线，面。
      geometry.vertices = line;
      //线构造
      //定义材质THREE.LineBasicMaterial . MeshBasicMaterial...都可以
      let material = new THREE.LineBasicMaterial({
        color: 0xff0000,
        linewidth: 500000,
        linecap: 'round', //ignored by WebGLRenderer
        linejoin: 'round' //ignored by WebGLRenderer
      });

      this.trackLine = new THREE.Line(geometry, material);

      // 加入到场景中
      this.scene.add(this.trackLine);
    }
    if (this.positionHistory.length > 1) {
      let lastPost = this.positionHistory[this.positionHistory.length - 1];
      if (lastPost.pos[0] != posEst[0] && lastPost.pos[1] != posEst[1]) {
        if (this.view.stationary && this.start) {
          this.view.goTo(
            {
              tilt: this.view.camera.tilt,
              center: [posEst[0], posEst[1]],
              zoom: 16
            },
            {animate: false, duration: 1000}
          );
        }
      }
    }

    // update lighting
    /////////////////////////////////////////////////////////////////////////////////////////////////////
    this.view.environment.lighting.date = Date.now();

    let l = context.sunLight;
    this.sun.position.set(l.direction[0], l.direction[1], l.direction[2]);
    this.sun.intensity = l.diffuse.intensity;
    this.sun.color = new THREE.Color(
      l.diffuse.color[0],
      l.diffuse.color[1],
      l.diffuse.color[2]
    );

    this.ambient.intensity = l.ambient.intensity;
    this.ambient.color = new THREE.Color(
      l.ambient.color[0],
      l.ambient.color[1],
      l.ambient.color[2]
    );

    // draw the scene
    /////////////////////////////////////////////////////////////////////////////////////////////////////
    this.renderer.resetGLState();
    this.renderer.render(this.scene, this.camera);

    // as we want to smoothly animate the ISS movement, immediately request a re-render
    externalRenderers.requestRender(this.view);

    // cleanup
    context.resetWebGLState();
  }
  private computeISSPosition() {
    const [externalRenderers, SpatialReference, Graphic] = [
      this.external[1],
      this.external[2],
      this.external[3]
    ];
    if (!this.start) {
      this.RenderTime = Date.now();
      if (this.positionHistory.length == 0) {
        this.lastTime = 0;
        return {
          pos: [
            this.dataResults[0].geometry.x,
            this.dataResults[0].geometry.y,
            0
          ],
          angle: 0,
          speed: 0
        };
      } else {
        return this.lastPosition;
      }
    }
    if (this.globalIndex < this.trackPoints.length) {
      this.positionHistory.push(this.trackPoints[this.globalIndex]);
      this.globalIndex++;
    }
    if (this.positionHistory.length == 0) {
      this.lastTime = 0;
      return {
        pos: [
          this.dataResults[0].geometry.x,
          this.dataResults[0].geometry.y,
          0
        ],
        angle: 0,
        speed: 0
      };
    }

    if (this.positionHistory.length == 1) {
      let entry1 = this.positionHistory[this.positionHistory.length - 1];

      this.RenderTime = Date.now();
      this.lastTime = entry1.time;
      this.lastEntry = entry1;
      this.lastPosition = {pos: entry1.pos, angle: 0, speed: 0};
      return {pos: entry1.pos, angle: 0, speed: 0};
    }

    let beforenow = this.RenderTime;

    // compute a new estimated position
    let dt1 = Date.now() - beforenow;
    let entry;
    for (let i = 1; i < this.positionHistory.length; i++) {
      let last = this.positionHistory[i];
      if (this.lastTime + dt1 < last.time) {
        entry = last;
        break;
      }
    }
    if (!entry) {
      //为空
      entry = this.positionHistory[this.positionHistory.length - 1];
      this.lastTime = entry.time;
      this.RenderTime = Date.now();
      return {pos: entry.pos, angle: entry.angle, speed: entry.speed};
    } else {
      if (entry.time != this.lastEntry.time) {
        this.view.goTo(
          {
            heading: entry.angle,
            center: [this.lastPosition.pos[0], this.lastPosition.pos[1]],
            zoom: 16,
            tilt: 70
          },
          {animate: true, duration: 1000}
        );
        let renderPos = [0, 0, 0];
        externalRenderers.toRenderCoordinates(
          this.view,
          [this.lastPosition.pos[0], this.lastPosition.pos[1], 1000],
          0,
          SpatialReference.WGS84,
          renderPos,
          0,
          1
        );

        let markerSymbol = {
          type: 'simple-marker', // autocasts as new SimpleMarkerSymbol()
          color: [255, 0, 0],
          outline: {
            // autocasts as new SimpleLineSymbol()
            color: [255, 255, 255],
            width: 2
          }
        };
        let lineSymbol = {
          type: 'simple-line', // autocasts as SimpleLineSymbol()
          color: [255, 0, 0],
          width: 4
        };
        let pg1 = new Graphic({
          geometry: {
            type: 'point', // autocasts as new Point()
            x: this.lastPosition.pos[0],
            y: this.lastPosition.pos[1],
            z: 55
          } as any,
          symbol: markerSymbol
        });
        let paths: any = [
          [this.lastPosition.pos[0], this.lastPosition.pos[1], 0],
          [this.lastPosition.pos[0], this.lastPosition.pos[1], 50]
        ];
        let pg2 = new Graphic({
          geometry: {
            type: 'polyline', // autocasts as new Polyline()
            paths: [paths]
          } as any,
          symbol: lineSymbol
        });
        this.view.graphics.add(pg1);
        this.view.graphics.add(pg2);
        if (this.speedText) {
          this.view.graphics.remove(this.speedText);
          this.speedText = new Graphic({
            geometry: {
              type: 'point', // autocasts as new Point()
              x: this.lastPosition.pos[0],
              y: this.lastPosition.pos[1],
              z: 1010
            },
            symbol: {
              type: 'label-3d', // autocasts as new LabelSymbol3D()
              symbolLayers: [
                {
                  type: 'text', // autocasts as new TextSymbol3DLayer()
                  material: {color: [49, 163, 84]},
                  size: 30 // points
                }
              ]
            }
          });
          this.view.graphics.add(this.speedText);
        }

        // let markerObject = new THREE.Mesh(
        //   this.markerGeometry,
        //   this.markerMaterial
        // );
        //markerObject.position.set(renderPos[0], renderPos[1], renderPos[2]);
        //添加红点
        //this.scene.add(markerObject);
        // if (this.font) {
        //   console.log(this.font);
        //   if (this.speedText) {
        //     this.scene.remove(this.speedText);
        //   }
        //   let geometry = new THREE.TextGeometry(
        //     '车速:' + entry.speed + 'km/h',
        //     {
        //       font: this.font,
        //       size: 15,
        //       height: 1,
        //       curveSegments: 50,
        //       bevelEnabled: true,
        //       bevelThickness: 2,
        //       bevelSize: 1.0,
        //       bevelOffset: 10,
        //       bevelSegments: 1
        //     }
        //   );
        //   this.speedText = new THREE.Mesh(
        //     geometry,
        //     new THREE.MeshBasicMaterial({color: 0x00ff00})
        //   );
        //   this.scene.add(this.speedText);
        // }
      }
    }
    // move the current position towards the estimated position
    let newPos = {
      pos: [
        this.lastPosition.pos[0] + dt1 * entry.vel[0],
        this.lastPosition.pos[1] + dt1 * entry.vel[1],
        entry.pos[2]
      ],
      angle: entry.angle,
      speed: entry.speed
    };
    this.lastPosition = newPos;
    this.lastTime = this.lastTime + dt1;
    this.lastEntry = entry;
    this.RenderTime = Date.now();
    return newPos;
  }

  /**
   * This function starts a chain of calls querying the current ISS position from open-notify.org every 5 seconds.
   */
  private async queryISSPosition() {
    const [Graphic] = [this.external[3]];
    let results = this.dataResults;
    let paths = [];
    let speed = '';
    for (let i = 0; i < results.length; i++) {
      let result = results[i];
      let vel = [0, 0];
      let angle = 0;
      if (this.trackPoints.length > 0) {
        let last = this.trackPoints[this.trackPoints.length - 1];
        let deltaT = result.timestamp - last.time;
        let vLon = (result.geometry.x - last.pos[0]) / deltaT;
        let vLat = (result.geometry.y - last.pos[1]) / deltaT;
        vel = [vLon, vLat];
        speed = GetSpeed(
          last.pos[1],
          last.pos[0],
          result.geometry.y,
          result.geometry.x,
          deltaT
        );
        angle = this.doarrowAngle(
          {x: last.pos[0], y: last.pos[1]},
          {
            x: result.geometry.x,
            y: result.geometry.y
          }
        );

        //result.angle=angle;
        //angle=doarrowAngle({x:last.pos[0],y:last.pos[1]},{x:result.geometry.x,y:result.geometry.y})
      }
      this.trackPoints.push({
        pos: [Number(result.geometry.x), Number(result.geometry.y), 1],
        time: result.timestamp,
        vel: vel,
        angle: angle, //qqqqq,
        speed: speed
      });
      paths.push([result.geometry.x, result.geometry.y, 10]);
    }
    this.graphicsLayer.removeAll();
    let polyline = {
      type: 'polyline', // autocasts as new Polyline()
      paths: [paths]
    };

    let lineSymbol = {
      type: 'simple-line', // autocasts as SimpleLineSymbol()
      color: [0, 0, 255],
      width: 2
    };

    let polylineGraphic = new Graphic({
      geometry: polyline,
      symbol: lineSymbol
    });
    this.graphicsLayer.add(polylineGraphic);
    // create a new marker object from the second most recent position update
    this.start = true;
  }
  private testFunc() {
    this.queryISSPosition();
  }
  private stopTrack() {
    this.start = false;
  }
  private startTrack() {
    this.start = true;
  }
  //车辆角度
  private doarrowAngle(p1: any, p2: any) {
    if (p2.x - p1.x == 0) {
      if (p2.y - p1.y > 0) {
        return 0;
      } else {
        return 180;
      }
    }
    if (p2.y - p1.y == 0) {
      if (p2.x - p1.x > 0) {
        return 90;
      } else {
        return 270;
      }
    }
    let angle = Math.atan2(p2.y - p1.y, p2.x - p1.x) * (180 / Math.PI);
    let px = 1,
      py = 1;
    if (p2.x > p1.x) {
      px = -1;
    }
    if (p2.y > p1.y) {
      py = -1;
    }
    return ((360 - angle + 90) % 360) - px * py * 5; //减去修正值
  }
}
