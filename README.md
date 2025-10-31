Link al vídeo: https://youtu.be/uNi6ZcTgpOs

Este proyecto es una simulación 3D interactiva del Sistema Solar, creada con Three.js.
Permite visualizar el Sol, los planetas, sus lunas y cinturones de asteroides, además de interactuar con ellos, mostrar información detallada y cambiar la vista entre los distintos planetas.

Características principales:

- Representación del Sol y los planetas con texturas realistas.
- Modelos con rotación y traslación orbital.
- Lunas animadas orbitando planetas seleccionados.
- Anillos de Saturno y Urano con texturas personalizadas.
- Cinturón de asteroides dinámico entre Marte y Júpiter.
- Iluminación realista (luz ambiental y luz puntual desde el Sol).
- Vista secundaria (mini-cámara) que permite observar desde cada planeta.
- Fondo estelar para una experiencia inmersiva.
- Interfaz gráfica interactiva con lil-gui
 para:

  - Cambiar la vista entre planetas.
  - Modificar la intensidad y color de las luces.
  - Activar el modo de creación de nuevos planetas.
  - Interacción con clics: al hacer clic sobre un planeta se muestra su información (radio, masa, descripción, etc.).


Se crea una escena (THREE.Scene), dos cámaras (camera y camera2) y un renderizador (THREE.WebGLRenderer).
También se definen luces ambientales y puntuales (el Sol).

Creación de objetos con las siguientes funciones:

  - Estrella() → Crea el Sol.
  - Planeta() → Crea planetas con textura, órbita y propiedades físicas.
  - Luna() → Añade lunas orbitando alrededor de los planetas.
  - CrearAnillos() → Genera anillos alrededor de planetas como Saturno y Urano.
  - generarCinturonAsteroides() → Simula rocas en órbita entre Marte y Júpiter.


La interfaz lil-gui permite controlar:

  - Intensidad y color de la luz ambiental y luz puntual (Sol).
  - Selección del planeta desde el cual observar.
  - Activar o desactivar el modo de creación de planetas personalizados.


Interacción con el Sistema Solar:

  - Al hacer clic en un planeta se muestra una etiqueta flotante con su información, gracias a la funciín mostrarEtiqueta().
  - Si el modo de creación está activo, se puede crear un nuevo planeta en la posición clickeada.
  - Se puede navegar a través del sistema con el ratón, con click izquierdo, para moverte de lado y con la rueda para moverte de alante hacia atrás.


Cámaras:

  - Cámara principal: controlada con el ratón (OrbitControls).
  - Cámara secundaria (mini vista): muestra el Sistema Solar desde la perspectiva del planeta seleccionado o mirando al Sol.
