import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import GUI from "lil-gui";

let scene, renderer;
let camera;
let camera2;
let info;
let grid;
let estrella,
  Planetas = [],
  Lunas = [];

let rocas = [];
let t0 = 0;
let accglobal = 0.001;
let timestamp;
let raycaster;
let plano;
let sombra = true;

const params = {
  Crear_planetas: false,
};

const planetas = {
  Mercurio: false,
  Venus: false,
  Tierra: true,
  Marte: false,
  Jupiter: false,
  Saturno: false,
  Urano: false,
  Neptuno: false,
};
const claves = Object.keys(planetas);

const rotaciones = {
  RotateX: 0,
  RotateY: 0,
  RotateZ: 0,
};

const vistaConfig = {
  planetaSeleccionado: "Tierra",
  verAlSol: true, // Por defecto mira al sol
};

var loader = new THREE.TextureLoader();
const gui = new GUI();

const style = document.createElement("style");
style.innerHTML = `
  .lil-gui.root {
    --background-color: rgba(0, 0, 0, 0.7) !important;
    --widget-color: rgba(255, 255, 255, 0.1) !important;
  }
  .lil-gui {
    --background-color: rgba(0, 0, 0, 0.7) !important;
  }
`;
document.head.appendChild(style);

//--- Texturas ---

//Tierra
const tx1 = new THREE.TextureLoader().load("src/Texture/earthmap1k.jpg");
const txb1 = new THREE.TextureLoader().load("src/Texture/earthbump1k.jpg");
const txspec1 = new THREE.TextureLoader().load("src/Texture/earthspec1k.jpg");
const tx1_cloud = new THREE.TextureLoader().load(
  "src/Texture/earthcloudmap.jpg"
);
const tx1alpha = new THREE.TextureLoader().load(
  "src/Texture/earthcloudmaptrans_invert.jpg"
);

//Resto de planetas
const tx2 = new THREE.TextureLoader().load("src/Texture/moonmap1k.jpg");
const tx3 = new THREE.TextureLoader().load("src/Texture/sol.jpeg");
const tx4 = new THREE.TextureLoader().load("src/Texture/marsmap1k.jpg");
const tx5 = new THREE.TextureLoader().load("src/Texture/venusmap.jpg");
const tx6 = new THREE.TextureLoader().load("src/Texture/mercurymap.jpg");
const tx7 = new THREE.TextureLoader().load("src/Texture/jupiter2_2k.jpg");
const tx8 = new THREE.TextureLoader().load("src/Texture/saturnmap.jpg");
const tx9 = new THREE.TextureLoader().load("src/Texture/uranusmap.jpg");
const tx10 = new THREE.TextureLoader().load("src/Texture/neptunemap.jpg");

//Todos los planetas
const texturas = [tx1, tx4, tx5, tx6, tx7, tx8, tx9, tx10];

//Texturas secundarias
const tx11 = new THREE.TextureLoader().load("src/Texture/phobosbump.jpg");
const tx12 = new THREE.TextureLoader().load("src/Texture/saturnringcolor.jpg");
const tx13 = new THREE.TextureLoader().load("src/Texture/uranusringcolour.jpg");
const tx14 = new THREE.TextureLoader().load("src/Texture/mercurybump.jpg");
const tx15 = new THREE.TextureLoader().load("src/Texture/venusbump.jpg");
const tx16 = new THREE.TextureLoader().load("src/Texture/marsbump1k.jpg");
const tx17 = new THREE.TextureLoader().load("src/Texture/deimosbump.jpg");

//--- Texturas ---

init();
animationLoop();

function init() {
  info = document.createElement("div");
  info.style.position = "absolute";
  info.style.top = "30px";
  info.style.width = "100%";
  info.style.textAlign = "center";
  info.style.color = "#fff";
  info.style.fontWeight = "bold";
  info.style.backgroundColor = "transparent";
  info.style.zIndex = "1";
  info.style.fontFamily = "Monospace";
  info.innerHTML = "three.js - sol y planetas";
  document.body.appendChild(info);

  //Defino cámara
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.set(0, 20, 0);

  //Defino segunda cámara
  camera2 = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );

  //--- Controles segunda cámara ---

  const view_Info = gui.addFolder("Vista Desde los planetas");

  view_Info
    .add(vistaConfig, "planetaSeleccionado", {
      Mercurio: "Mercurio",
      Venus: "Venus",
      Tierra: "Tierra",
      Marte: "Marte",
      Jupiter: "Jupiter",
      Saturno: "Saturno",
      Urano: "Urano",
      Neptuno: "Neptuno",
    })
    .name("Seleccionar Planeta")
    .onChange((value) => {
      for (let planeta in planetas) {
        planetas[planeta] = false;
      }
      planetas[value] = true;
    });

  // Añadir checkbox para ver al sol
  view_Info.add(vistaConfig, "verAlSol").name("Mirar al Sol");
  //--- Controles segunda cámara ---

  //--- Plano, controles y renderer ---
  renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  raycaster = new THREE.Raycaster();

  let camcontrols = new OrbitControls(camera, renderer.domElement);

  let geometryp = new THREE.PlaneGeometry(200, 200);
  let materialp = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.0, // invisible pero clickeable
  });
  plano = new THREE.Mesh(geometryp, materialp);
  plano.rotation.x = -Math.PI / 2;
  scene.add(plano);

  //--- Plano, controles y renderer

  //---- Luces ----
  const Lamb = new THREE.AmbientLight(0xffffff, 0.25);
  scene.add(Lamb);
  // Crear panel GUI para la luz ambiente
  const Lamb_Info = gui.addFolder("luz ambiente");

  // Recupera color de la luz par ala GUI
  const Lamb_Params = { color: Lamb.color.getHex() };

  // Control para ajustar intensidad, parámetros con valores extremos e incremento
  Lamb_Info.add(Lamb, "intensity", 0, 1, 0.1).name("Intensidad");
  // Control para ajustar el color
  Lamb_Info.addColor(Lamb_Params, "color")
    .name("Color")
    .onChange((value) => Lamb.color.set(value));

  // Abrir panel GUI de luz ambiente
  Lamb_Info.close();

  const Lpunt = new THREE.PointLight(0xffffff, 1, 0, 2);
  Lpunt.position.set(0, 0, 0);
  if (sombra) Lpunt.castShadow = true;
  scene.add(Lpunt);

  // Crear carpeta para la luz puntual
  const Lpunt_Info = gui.addFolder("luz puntual");

  // Parámetros de la luz puntual
  const Lpunt_Params = {
    visible: true,
    color: Lpunt.color.getHex(),
  };

  // Control para ajustar la visibilidad de la luz
  Lpunt_Info.add(Lpunt_Params, "visible")
    .name("Visible")
    .onChange((value) => {
      Lpunt.visible = value;
    });

  // Control para ajustar la intensidad de la luz puntual
  Lpunt_Info.add(Lpunt, "intensity", 0, 10, 0.1).name("Intensidad");

  // Control para ajustar el color de la luz puntual
  Lpunt_Info.addColor(Lpunt_Params, "color")
    .name("Color")
    .onChange((value) => Lpunt.color.set(value));

  // Abrir la carpeta por defecto
  Lpunt_Info.close();

  //--- Luces ---

  //--- Objetos ---

  //Sol
  Estrella(1.8, 0xffffff, tx3);

  //Mercurio
  Planeta(
    0.1,
    3.0,
    0.1,
    0xffffff,
    1.0,
    1.0,
    0,
    {
      nombre: "Mercurio",
      radio: "2,440 km",
      masa: "3.30 * 10²³ kg",
      periodo: "88 días",
      descripcion: "Planeta más cercano al Sol",
    },
    tx6,
    tx14
  );

  //Venus
  Planeta(
    0.3,
    6.0,
    0.4,
    0xffffff,
    1.0,
    1.0,
    (-177.3 * Math.PI) / 180,
    {
      nombre: "Venus",
      radio: "6,052 km",
      masa: "4.87 * 10²⁴ kg",
      periodo: "225 días",
      descripcion: "Planeta más caliente",
    },
    tx5,
    tx15
  );

  //Tierra y luna
  Planeta(
    0.5,
    8.0,
    0.3,
    0xffffff,
    1.0,
    1.0,
    (-23.4 * Math.PI) / 180,
    {
      nombre: "Tierra",
      radio: "6,371 km",
      masa: "5.97 * 10²⁴ kg",
      periodo: "365 días",
      descripcion: "Nuestro planeta",
    },
    tx1,
    txb1,
    txspec1
  );
  Esfera(
    Planetas[2],
    Planetas[2].position.x,
    Planetas[2].position.y,
    Planetas[2].position.z,
    0.51,
    10,
    10,
    0xffffff,
    tx2,
    undefined,
    undefined,
    tx1alpha
  );
  Luna(Planetas[2], 0.15, 0.75, -3.5, 0xffffff, 0.0, tx2);

  //Marte
  Planeta(
    0.4,
    12,
    -0.3,
    0xffffff,
    1.0,
    1.0,
    (-25.2 * Math.PI) / 180,
    {
      nombre: "Marte",
      radio: "3,390 km",
      masa: "6.42 * 10²³ kg",
      periodo: "687 días",
      descripcion: "El 'planeta rojo'",
    },
    tx4,
    tx16
  );
  Luna(Planetas[3], 0.09, 1, 1.2, 0xffffff, 0.0, tx11);
  Luna(Planetas[3], 0.11, 0.75, -0.5, 0xffffff, 0.0, tx17);

  generarCinturonAsteroides(1000, 0.02, 0.07, 15, 0.01, tx11);

  //Jupiter
  Planeta(
    1.2,
    20,
    0.2,
    0xffffff,
    1.0,
    1.0,
    (-3.1 * Math.PI) / 180,
    {
      nombre: "Júpiter",
      radio: "69,911 km",
      masa: "1.90 * 10²⁷ kg",
      periodo: "11.86 años",
      descripcion: "Planeta más grande del Sistema Solar",
    },
    tx7
  );

  //Saturno
  Planeta(
    1.0,
    25,
    0.13,
    0xffffff,
    1.0,
    1.0,
    (-26.7 * Math.PI) / 180,
    {
      nombre: "Saturno",
      radio: "58,232 km",
      masa: "5.68 * 10²⁶ kg",
      periodo: "29.45 años",
      descripcion: "Famoso por sus anillos",
    },
    tx8
  );
  CrearAnillos(Planetas[5], 1.4, 2.7, tx12, undefined, 0xffffff, Math.PI / 2);

  //Urano
  Planeta(
    0.7,
    30,
    0.24,
    0xffffff,
    1.0,
    1.0,
    (-97.8 * Math.PI) / 180,
    {
      nombre: "Urano",
      radio: "25,362 km",
      masa: "8.68 * 10²⁵ kg",
      periodo: "84 años",
      descripcion: "Un gigante helado",
    },
    tx9
  );
  CrearAnillos(
    Planetas[6],
    0.9,
    1.5,
    tx13,
    undefined,
    0xffffff,
    (Math.PI * 3) / 4
  );

  //Neptuno
  Planeta(
    0.6,
    37,
    0.09,
    0xffffff,
    1.0,
    1.0,
    (-28.3 * Math.PI) / 180,
    {
      nombre: "Neptuno",
      radio: "24,622 km",
      masa: "1.02 * 10²⁶ kg",
      periodo: "164.8 años",
      descripcion: "El planeta más lejano del Sol",
    },
    tx10
  );

  //--- Objetos ---

  //--- GUI crear planetas ---
  const gui_planetas = gui.addFolder("Planeta");
  gui_planetas
    .add(params, "Crear_planetas")
    .name("Crear_planetas")
    .onChange((value) => {
      params.crear_planeta = value;
    });

  //--- GUI crear planetas ---

  //---  Cargar texturas del fondo ---
  loader.load("src/Texture/cielo-con-estrellas.jpg", function (texture) {
    scene.background = texture;
  });

  document.addEventListener("mousedown", onDocumentMouseDown);
}

//--- Funciones auxiliares ---

function Estrella(rad, col, texture = undefined) {
  let geometry = new THREE.SphereGeometry(rad, 20, 20);
  let material = new THREE.MeshBasicMaterial({ color: col });

  if (texture != undefined) {
    material.map = texture;
  }

  estrella = new THREE.Mesh(geometry, material);

  scene.add(estrella);
}

function Planeta(
  radio,
  dist,
  vel,
  col,
  f1,
  f2,
  angle,
  infoExtra = {},
  texture = undefined,
  texbump = undefined,
  texspec = undefined,
  texalpha = undefined
) {
  if (radio < 0.05) {
    radio = 0.1;
  }

  let geom = new THREE.SphereGeometry(radio, 10, 10);
  let material = new THREE.MeshPhongMaterial({ color: col });

  if (texture != undefined) {
    material.map = texture;
  }
  //Rugosidad
  if (texbump != undefined) {
    material.bumpMap = texbump;
    material.bumpScale = 0.1;
  }

  //Especular
  if (texspec != undefined) {
    material.specularMap = texspec;
    material.specular = new THREE.Color("orange");
  }

  //Transparencia
  if (texalpha != undefined) {
    //Con mapa de transparencia
    material.alphaMap = texalpha;
    material.transparent = true;
    material.side = THREE.DoubleSide;
    material.opacity = 1.0;

    //Sin mapa de transparencia
    /*material.transparent = true;
    material.side = THREE.DoubleSide;
    material.opacity = 0.8;
    material.transparent = true;
    material.depthWrite = false;*/
  }

  let planeta = new THREE.Mesh(geom, material);
  planeta.userData.dist = dist;
  planeta.userData.radio = radio;
  planeta.userData.speed = vel;
  planeta.userData.f1 = f1;
  planeta.userData.f2 = f2;
  planeta.userData.angle = angle;

  planeta.userData.startTime = timestamp;
  planeta.userData.info = infoExtra;

  planeta.rotation.z = angle;

  Planetas.push(planeta);
  scene.add(planeta);

  //Dibuja trayectoria, con
  let curve = new THREE.EllipseCurve(
    0,
    0, // centro
    dist * f1,
    dist * f2 // radios elipse
  );
  //Crea geometría
  let points = curve.getPoints(50);
  let geome = new THREE.BufferGeometry().setFromPoints(points);
  let mate = new THREE.LineBasicMaterial({ color: 0xffffff });
  // Objeto
  let orbita = new THREE.Line(geome, mate);

  // AÑADIR ESTA LÍNEA: Rotar la órbita 90° para que esté en el plano XZ
  orbita.rotation.x = Math.PI / 2;

  scene.add(orbita);
}

function Luna(planeta, radio, dist, vel, col, angle, texture = undefined) {
  var pivote = new THREE.Object3D();
  pivote.rotation.x = angle;
  planeta.add(pivote);
  var geom = new THREE.SphereGeometry(radio, 10, 10);
  var mat = new THREE.MeshPhongMaterial({ color: col });

  if (texture != undefined) {
    mat.map = texture;
  }

  var luna = new THREE.Mesh(geom, mat);
  luna.userData.dist = dist;
  luna.userData.speed = vel;

  Lunas.push(luna);
  pivote.add(luna);
}

function Rocas(radio, dist, vel, col, f1, f2, angle, texture = undefined) {
  // Crea la geometría y el material
  const geom = new THREE.SphereGeometry(radio, 8, 8);
  const mat = new THREE.MeshPhongMaterial({ color: col });

  if (texture !== undefined) {
    mat.map = texture;
  }

  const roca = new THREE.Mesh(geom, mat);

  // Posición inicial en base al ángulo
  roca.position.x = Math.cos(angle) * dist * f1;
  roca.position.z = Math.sin(angle) * dist * f2; // Era .y
  roca.position.y = (Math.random() - 0.5) * 1.0;

  roca.userData = {
    dist: dist,
    speed: vel,
    f1: f1,
    f2: f2,
    angle: angle,
    startTime: timestamp,
  };

  rocas.push(roca);
  scene.add(roca);
  return roca;
}

function Esfera(
  padre,
  px,
  py,
  pz,
  radio,
  nx,
  ny,
  col,
  texture = undefined,
  texbump = undefined,
  texspec = undefined,
  texalpha = undefined
) {
  let geometry = new THREE.SphereBufferGeometry(radio, nx, ny);
  //Material Phong definiendo color
  let material = new THREE.MeshPhongMaterial({
    color: col,
    side: THREE.DoubleSide,
    transparent: true,
    depthWrite: true,
    opacity: 1.0,
  });

  //Textura
  if (texture != undefined) {
    material.map = texture;
  }
  //Rugosidad
  if (texbump != undefined) {
    material.bumpMap = texbump;
    material.bumpScale = 0.1;
  }

  //Especular
  if (texspec != undefined) {
    material.specularMap = texspec;
    material.specular = new THREE.Color("orange");
  }

  //Transparencia
  if (texalpha != undefined) {
    //Con mapa de transparencia
    material.alphaMap = texalpha;
    material.transparent = true;
    material.side = THREE.DoubleSide;
    material.opacity = 1.0;

    //Sin mapa de transparencia
    /*material.transparent = true;
    material.side = THREE.DoubleSide;
    material.opacity = 0.8;
    material.transparent = true;
    material.depthWrite = false;*/
  }

  let mesh = new THREE.Mesh(geometry, material);
  if (sombra) mesh.castShadow = true;
  mesh.position.set(px, py, pz);
  padre.add(mesh);
}

function CrearAnillos(
  padre,
  innerRadius,
  outerRadius,
  texture = undefined,
  texalpha = undefined,
  col,
  angle
) {
  let geom = new THREE.RingBufferGeometry(innerRadius, outerRadius, 128);
  let material = new THREE.MeshPhongMaterial({
    color: col,
    side: THREE.DoubleSide,
  });

  const pos = geom.attributes.position;
  const uv = geom.attributes.uv;
  const v3 = new THREE.Vector3();

  for (let i = 0; i < pos.count; i++) {
    v3.fromBufferAttribute(pos, i);
    const r = Math.sqrt(v3.x * v3.x + v3.y * v3.y);
    const t = (r - innerRadius) / (outerRadius - innerRadius);
    uv.setXY(i, t, 1.0);
  }

  //Textura
  if (texture != undefined) {
    material.map = texture;
  }
  //Transparencia
  if (texalpha != undefined) {
    //Con mapa de transparencia
    material.alphaMap = texalpha;
    material.transparent = true;
    material.side = THREE.DoubleSide;
    material.opacity = 1.0;
  }

  const anillos = new THREE.Mesh(geom, material);
  anillos.rotation.x = angle;
  padre.add(anillos);
}

function generarCinturonAsteroides(
  numRocas,
  radioMin,
  radioMax,
  dist,
  vel,
  textura = undefined
) {
  for (let i = 0; i < numRocas; i++) {
    const angle = (i / numRocas) * Math.PI * 2; // Distribuidas en círculo
    const f1 = 1.0 + (Math.random() - 0.5) * 0.05; // pequeñas variaciones elípticas
    const f2 = 1.0 + (Math.random() - 0.5) * 0.05;
    const r = radioMin + Math.random() * (radioMax - radioMin);

    Rocas(r, dist, vel, 0xffffff, f1, f2, angle, textura);
  }
}

function onDocumentMouseDown(event) {
  //Conversión coordenadas del puntero
  const mouse = {
    x: (event.clientX / renderer.domElement.clientWidth) * 2 - 1,
    y: -(event.clientY / renderer.domElement.clientHeight) * 2 + 1,
  };

  //Intersección, define rayo
  raycaster.setFromCamera(mouse, camera);
  if (params.crear_planeta) {
    // Intersecta
    const intersects = raycaster.intersectObject(plano);
    // ¿Hay alguna intersección?
    if (intersects.length > 0) {
      const p = intersects[0].point;
      const dist = Math.sqrt(p.x * p.x + p.z * p.z); // Cambiar p.y por p.z
      const angle = Math.atan2(p.z, p.x);

      const numeroAleatorio = Math.floor(Math.random() * texturas.length);
      const textura_aleatoria = texturas[numeroAleatorio];

      Planeta(
        Math.random(),
        dist,
        Math.random() * 4,
        0xffffff,
        1.0,
        1.0,
        angle,
        {},
        textura_aleatoria
      );
    }
  } else {
    const intersects = raycaster.intersectObjects(Planetas, true);
    if (intersects.length > 0) {
      let planetaSeleccionado = intersects[0].object;

      if (intersects.length > 1) {
        planetaSeleccionado = intersects[1].object;
      }

      // Si ya tiene etiqueta, la eliminamos
      if (planetaSeleccionado.userData.label) {
        scene.remove(planetaSeleccionado.userData.label);
        planetaSeleccionado.userData.label = null;
      } else {
        mostrarEtiqueta(planetaSeleccionado);
      }
    }
  }
}

function mostrarEtiqueta(planeta) {
  const info = planeta.userData.info || {};

  const texto = `
    ${info.nombre}
    ${info.radio ? "Radio: " + info.radio : ""}
    ${info.masa ? "Masa: " + info.masa : ""}
    ${info.periodo ? "Periodo: " + info.periodo : ""}
    ${info.descripcion ? info.descripcion : ""}
  `;

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  // Ajustar tamaño del canvas según el texto
  const maxWidth = 300; // ancho máximo del texto en píxeles
  let fontSize = 20; // tamaño inicial
  ctx.font = `${fontSize}px Arial`;

  // Ajuste dinámico del tamaño de fuente si el texto es demasiado largo
  while (ctx.measureText(info.nombre).width > maxWidth) {
    fontSize -= 1;
    ctx.font = `${fontSize}px Arial`;
  }

  // Ajuste canvas
  const lineHeight = fontSize * 1.2;
  const lines = texto.split("\n");
  canvas.width = maxWidth;
  canvas.height = lineHeight * lines.length;

  // Dibujar fondo semitransparente
  ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Dibujar texto línea por línea
  ctx.fillStyle = "white";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.font = `${fontSize}px Arial`;
  for (let i = 0; i < lines.length; i++) {
    ctx.fillText(lines[i], canvas.width / 2, i * lineHeight);
  }

  // Crear textura y sprite
  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
  });
  const sprite = new THREE.Sprite(material);

  // Ajustar escala proporcional al canvas
  sprite.scale.set(canvas.width / 50, canvas.height / 50, 1);

  sprite.position.set(
    planeta.position.x + planeta.geometry.parameters.radius + 0.7,
    planeta.position.y + 1.5,
    planeta.position.z
  );

  planeta.userData.label = sprite;
  scene.add(sprite);
}

//--- Funciones auxiliares ---

//--- Bucle de animación ---
function animationLoop() {
  timestamp = (Date.now() - t0) * accglobal;
  requestAnimationFrame(animationLoop);

  //Modifica rotación de todos los objetos
  for (let object of Planetas) {
    const elapsed = timestamp - (object.userData.startTime || 0);
    const theta =
      elapsed * object.userData.speed + (object.userData.angle || 0);

    object.position.x =
      Math.cos(theta) * object.userData.f1 * object.userData.dist;
    object.position.z =
      Math.sin(theta) * object.userData.f2 * object.userData.dist; // Era .y
    object.rotation.y += 0.03;

    if (object.userData.label) {
      const offset = object.geometry.parameters.radius + 0.7;
      object.userData.label.position.set(
        object.position.x + offset,
        object.position.y + 1.5,
        object.position.z
      );
    }
  }

  for (let object of Lunas) {
    object.position.x =
      Math.cos(timestamp * object.userData.speed) * object.userData.dist;
    object.position.z =
      Math.sin(timestamp * object.userData.speed) * object.userData.dist;
  }

  for (let object of rocas) {
    const elapsed = timestamp - (object.userData.startTime || 0);
    const theta =
      elapsed * object.userData.speed + (object.userData.angle || 0);

    object.position.x =
      Math.cos(theta) * object.userData.f1 * object.userData.dist;
    object.position.z =
      Math.sin(theta) * object.userData.f2 * object.userData.dist;
  }

  //Cámara 1
  let x = 0;
  let y = 0;
  let w = window.innerWidth;
  let h = window.innerHeight;
  renderer.setViewport(x, y, w, h);
  renderer.setScissor(x, y, w, h);
  renderer.setScissorTest(true);
  renderer.render(scene, camera);

  //Cámara 2
  const insetWidth = window.innerWidth / 4;
  const insetHeight = window.innerHeight / 4;

  renderer.setViewport(0, 10, insetWidth, insetHeight);
  renderer.setScissor(0, 10, insetWidth, insetHeight);
  renderer.setScissorTest(true);

  let planetaSeleccionado = -1;
  for (let i = 0; i < claves.length; i++) {
    if (planetas[claves[i]]) {
      planetaSeleccionado = i;
      break;
    }
  }

  // Si hay un planeta seleccionado, posicionar la cámara allí
  if (planetaSeleccionado >= 0 && planetaSeleccionado < Planetas.length) {
    if (vistaConfig.verAlSol) {
      camera2.position.set(
        Planetas[planetaSeleccionado].position.x,
        Planetas[planetaSeleccionado].position.y + 2,
        Planetas[planetaSeleccionado].position.z
      );
    } else {
      camera2.position.set(
        Planetas[planetaSeleccionado].position.x +
          5 * Planetas[planetaSeleccionado].userData.radio,
        Planetas[planetaSeleccionado].position.y +
          2 * Planetas[planetaSeleccionado].userData.radio,
        Planetas[planetaSeleccionado].position.z
      );
    }
  }

  if (vistaConfig.verAlSol) {
    camera2.lookAt(estrella.position);
  } else {
    // Opcional: mirar en la dirección del movimiento del planeta
    camera2.lookAt(
      Planetas[planetaSeleccionado].position.x,
      Planetas[planetaSeleccionado].position.y,
      Planetas[planetaSeleccionado].position.z
    ); // o cualquier otra dirección
  }

  renderer.render(scene, camera2);
}
