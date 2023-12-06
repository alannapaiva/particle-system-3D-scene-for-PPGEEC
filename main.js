
    import * as THREE from 'three';
    import { FontLoader } from 'three/addons/loaders/FontLoader.js';
    import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';

    // Configuração da cena, câmera e renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(85, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 30;

    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // Configuração do material para as partículas
    const boxSize = 0.2;
    const geometry = new THREE.BoxGeometry(boxSize, boxSize, boxSize);
    const materialGreen = new THREE.MeshStandardMaterial({ color: 0xffffff, opacity: 0.4, side: THREE.DoubleSide });

    // Configuração das partículas
    const pitchSegments = 60;
    const elevationSegments = pitchSegments / 2;
    const particles = pitchSegments * elevationSegments;
    const side = Math.pow(particles, 1 / 3);
    const radius = 20;

    const parentContainer = new THREE.Object3D();
    scene.add(parentContainer);

    function posInBox(place) {
      return ((place / side) - 0.5) * radius * 1.2;
    }

    for (let p = 0; p < pitchSegments; p++) {
      const pitch = Math.PI * 2 * p / pitchSegments;
      for (let e = 0; e < elevationSegments; e++) {
        const elevation = Math.PI * ((e / elevationSegments) - 0.5);
        const particle = new THREE.Mesh(geometry, materialGreen);

        parentContainer.add(particle);

        const dest = new THREE.Vector3();
        dest.z = (Math.sin(pitch) * Math.cos(elevation)) * radius;
        dest.x = (Math.cos(pitch) * Math.cos(elevation)) * radius;
        dest.y = Math.sin(elevation) * radius;

        particle.position.x = posInBox(parentContainer.children.length % side);
        particle.position.y = posInBox(Math.floor(parentContainer.children.length / side) % side);
        particle.position.z = posInBox(Math.floor(parentContainer.children.length / Math.pow(side, 2)) % side);

        particle.userData = { dests: [dest, particle.position.clone()], speed: new THREE.Vector3() };
      }
    }

    // Configuração do texto
    const loader = new FontLoader();
    let droid_serif_regular;

    loader.load('./fonts/droid_serif_regular.typeface.json', (font) => {
      droid_serif_regular = font;

      const textGeometry = new TextGeometry('PPGEEC', {
        font: droid_serif_regular,
        size: 2,
        height: 0.5,
      });

      textGeometry.computeBoundingBox();
      const textCenter = new THREE.Vector3().copy(textGeometry.boundingBox.min).add(textGeometry.boundingBox.max).multiplyScalar(0.5);

      const xOffset = -textCenter.x + textGeometry.boundingBox.min.x;
      textGeometry.translate(xOffset, 0, 0);

      const textMaterial = new THREE.MeshStandardMaterial({ color: 0xff00ff });
      const textMesh = new THREE.Mesh(textGeometry, textMaterial);
      textMesh.position.set(0, -textCenter.y, 0);

      scene.add(textMesh);

      // Adiciona uma luz ambiente
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
      scene.add(ambientLight);

      // Adiciona uma luz direcional para criar sombras
      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
      scene.add(directionalLight);

      // Adiciona um ponto de luz para seguir o cursor do mouse
      const pointLight = new THREE.PointLight(0xffff00, 100);
      scene.add(pointLight);

      // Função para renderizar a cena
      function render() {
        // Atualiza as partículas
        let phase = performance.now() * 0.0005; // Use performance.now() para garantir que a animação seja contínua
        for (let i = 0, l = parentContainer.children.length; i < l; i++) {
          const particle = parentContainer.children[i];
          const dest = particle.userData.dests[Math.floor(phase) % particle.userData.dests.length].clone();
          const diff = dest.sub(particle.position);
          particle.userData.speed.divideScalar(1.02);
          particle.userData.speed.add(diff.divideScalar(400));
          particle.position.add(particle.userData.speed);
          particle.lookAt(dest);
        }

        // Rotaciona as partículas
        parentContainer.rotation.y = phase * 3;
        parentContainer.rotation.x = (mousePos.y - 0.5) * Math.PI;
        parentContainer.rotation.z = (mousePos.x - 0.5) * Math.PI;

        // Rotaciona o texto
        textMesh.rotation.copy(parentContainer.rotation);

        // Atualiza a posição da luz com base na posição do mouse
        const mousePos3D = new THREE.Vector3((mousePos.x - 0.5) * 100, -(mousePos.y - 0.5) * 100, 50);
        directionalLight.position.copy(mousePos3D);

        // Renderiza a cena
        renderer.render(scene, camera);

        // Continua a animação
        requestAnimationFrame(render);
      }

      // Adiciona evento de movimento do mouse
      document.addEventListener('mousemove', (event) => {
        mousePos = { x: event.clientX / window.innerWidth, y: event.clientY / window.innerHeight };
      });

      let mousePos = { x: 0.5, y: 0.5 };

      // Inicia a renderização
      render();
    });