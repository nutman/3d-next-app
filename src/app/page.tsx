'use client';

import { useEffect, useRef } from 'react';
import {
  AmbientLight, BufferGeometry, CatmullRomCurve3, CylinderGeometry,
  DoubleSide, Float32BufferAttribute, Group,
  Mesh, MeshBasicMaterial,
  MeshStandardMaterial, Object3D,
  PCFSoftShadowMap,
  PerspectiveCamera,
  PlaneGeometry, PointLight, Points, PointsMaterial,
  Scene, SphereGeometry,
  SpotLight,
  SRGBColorSpace, TubeGeometry,
  Vector3,
  WebGLRenderer
} from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const speed = 0.1;
const minY = 1.05;
const rotationSpeed = 0.03;

const baseLightIntensity = 0;
const activeLightIntensity = 150;



function createStarfield(count = 1000, spread = 500) {
  const geometry = new BufferGeometry();
  const positions = [];

  for (let i = 0; i < count; i++) {
    const x = (Math.random() - 0.5) * spread;
    const y = (Math.random() - 0.5) * spread;
    const z = (Math.random() - 0.5) * spread;
    positions.push(x, y, z);
  }

  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));

  const material = new PointsMaterial({
    color: 0xffffff,
    size: 0.7,
    sizeAttenuation: true,
  });

  const stars = new Points(geometry, material);
  return stars;
}

const fireLaser = (scene,playerGroup,  laserShots) => {
  if (!playerGroup) return;

  // Create laser geometry
  const geometry = new CylinderGeometry(0.05, 0.05, 2, 8, 1);
  const material = new MeshBasicMaterial({ color: 0xff3333 }); // bright red
  const laser = new Mesh(geometry, material);

  // Position laser at the ship's front
  laser.position.set(0, 0.3, 1.2); // Slightly in front of the ship (adjust as needed)
  playerGroup.add(laser);

  // Convert to world position
  const worldPos = new Vector3();
  laser.getWorldPosition(worldPos);
  scene.add(laser);
  playerGroup.remove(laser);
  laser.position.copy(worldPos);

  // Set laser direction based on ship’s facing
  const direction = new Vector3(0, 0, 1).applyQuaternion(playerGroup.quaternion).normalize();
  (laser as any).velocity = direction.multiplyScalar(3); // Speed

  laserShots.push(laser);
};


export default function Home() {
  const containerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  const keysPressed = useRef<{ [key: string]: boolean }>({});

  const scene = new Scene();

  let playerGroup: Group | null = null;

  let engineLight1: PointLight | null = null;
  let engineLight2: PointLight | null = null;
  let engineLight3: PointLight | null = null;
  let engineLight4: PointLight | null = null;
  let engineLight5: PointLight | null = null;

  let mesh: Group  | null = null
  let curvedCylinder: Mesh  | null = null

  const laserShots: Mesh[] = [];

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // event.preventDefault();
      keysPressed.current[event.code] = true;
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      // event.preventDefault();

      engineLight1!.intensity = baseLightIntensity;
      engineLight2!.intensity = baseLightIntensity;
      engineLight3!.intensity = baseLightIntensity;
      engineLight4!.intensity = baseLightIntensity;
      engineLight5!.intensity = baseLightIntensity;

      keysPressed.current[event.code] = false;

      curvedCylinder!.material.opacity = 0;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);



    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space') fireLaser(scene, playerGroup, laserShots);
    });

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);


  useEffect(() => {
    if (!containerRef.current) return;

    // Renderer
    const renderer = new WebGLRenderer({ antialias: true });
    renderer.outputColorSpace = SRGBColorSpace;
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = PCFSoftShadowMap;

    containerRef.current.appendChild(renderer.domElement);

    // Scene and Camera

    // const camera = new PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 1000);
    const camera = new PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(4, 5, 11);

    //   // Controls
    // const controls = new OrbitControls(camera, renderer.domElement);
    // controls.enableDamping = true;
    // controls.enablePan = false;
    // controls.minDistance = 5;
    // controls.maxDistance = 20;
    // controls.minPolarAngle = 0.5;
    // controls.maxPolarAngle = 1.5;
    // controls.autoRotate = false;
    // controls.target = new Vector3(0, 1, 0);
    // controls.update();

    // Ground
    const groundGeometry = new PlaneGeometry(120, 120, 32, 32);
    groundGeometry.rotateX(-Math.PI / 2);
    const groundMaterial = new MeshStandardMaterial({
      color: 0x555555,
      side: DoubleSide,
    });
    const groundMesh = new Mesh(groundGeometry, groundMaterial);
    groundMesh.castShadow = false;
    groundMesh.receiveShadow = true;
    scene.add(groundMesh);

    // Light
    const spotLight = new SpotLight(0xffffff, 3000, 200, 0.22, 0.5);
    const ambientLight = new AmbientLight(0xffffff, 0.5);

    spotLight.position.set(0, 35, 0);
    spotLight.castShadow = true;
    spotLight.shadow.bias = -0.0001;
    scene.add(spotLight);
    scene.add(ambientLight);

    // const engineLight = new PointLight(0x66ccff, 5, 10);
    // engineLight.position.set(0, 0, -2); // You may tweak this based on model scale
    // scene.add(engineLight);

    // Model
    const loader = new GLTFLoader().setPath('millennium_falcon/');
    loader.load('scene.gltf', (gltf) => {
      console.log('loading model');
      mesh = gltf.scene;

      mesh.traverse((child) => {
        if ((child as Mesh).isMesh) {
          (child as Mesh).castShadow = true;
          (child as Mesh).receiveShadow = true;
        }
      });

      mesh.position.set(0, 1.05, -1);

      scene.add(createStarfield(2000, 1000));
      scene.add(mesh);

      /**
       * start cilinder
       */
        // Define a curved path (e.g., a quarter arc)
      const curve = new CatmullRomCurve3([
        new Vector3(0, 0, 0),
        new Vector3(0.02, 0, -0.1),
        new Vector3(1, 0, -0.6),
        new Vector3(2, 0, -0.8),
        new Vector3(3, 0, -0.6),
        new Vector3(3.98, 0, -0.1),
        new Vector3(3, 0, 0),
      ]);

      // Create TubeGeometry along the path
      const tubeGeometry = new TubeGeometry(curve, 64, 0.1, 8, false);

      // Create material
      const tubeMaterial = new MeshStandardMaterial({
        color: 0x66ccff,
        roughness: 0.4,
        metalness: 0.1,
        opacity: 0,
        transparent: true,
      });

      // Mesh
      curvedCylinder = new Mesh(tubeGeometry, tubeMaterial);
      curvedCylinder!.position.set(-2, 0, -2)
      mesh.add(curvedCylinder);

      /**
       * end cilinder
       */

      function createEngineLight(x,y,z) {
        const light = new PointLight(0x66ccff, 5, 10);
        light.position.set(x,y,z);
        light.intensity = baseLightIntensity;
        mesh!.add(light);

        return light;
      }

      engineLight1 = createEngineLight(1.5, 0, -2.6); // position relative to the ship's origin

      engineLight2 = createEngineLight(0.75, 0, -2.83); // position relative to the ship's origin

      engineLight3 = createEngineLight(0, 0, -2.95); // position relative to the ship's origin

      engineLight4 = createEngineLight(-0.75, 0, -2.83); // position relative to the ship's origin

      engineLight5 = createEngineLight(-1.5, 0, -2.6); // position relative to the ship's origin




      // // Create a glowing blue sphere
      // const sphereGeometry = new SphereGeometry(0.1, 32, 32);
      // const sphereMaterial = new MeshBasicMaterial({ color: 0x66ccff });
      // const glowSphere = new Mesh(sphereGeometry, sphereMaterial);
      //
      // // Position it at the back of the ship (relative coordinates)
      // glowSphere.position.set(0, 0.04, -2.8);
      //
      // // Attach it to the ship so it moves with it
      // mesh.add(glowSphere);

      playerGroup = mesh;

      if (progressRef.current) {
        progressRef.current.style.display = 'none';
      }
    }, (xhr) => {
      console.log(`loading ${xhr.loaded / xhr.total * 100}%`);
    }, (error) => {
      console.error(error);
    });

    // Resize Handler
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    const moveMap: { [key: string]: (rotationY: number | never) => void } = {
      KeyW: (rotationY: number) => {
        playerGroup!.position.x += Math.sin(rotationY) * speed;
        playerGroup!.position.z += Math.cos(rotationY) * speed;
      },
      KeyS: (rotationY: number) => {
        playerGroup!.position.x -= Math.sin(rotationY) * speed;
        playerGroup!.position.z -= Math.cos(rotationY) * speed;
      },
      KeyA: () => (playerGroup!.rotation.y += rotationSpeed),
      // KeyA: (rotationY: number) => {
      //   playerGroup!.position.x += Math.cos(rotationY) * speed;
      //   playerGroup!.position.z -= Math.sin(rotationY) * speed;
      // },
      KeyD: () => (playerGroup!.rotation.y -= rotationSpeed),
      // KeyD: (rotationY: number) => {
      //   playerGroup!.position.x -= Math.cos(rotationY) * speed;
      //   playerGroup!.position.z += Math.sin(rotationY) * speed;
      // },
      ArrowUp: () => (playerGroup!.position.y += speed),
      ArrowDown: () => (playerGroup!.position.y = Math.max(playerGroup!.position.y - speed, minY)),
      // KeyQ: () => (playerGroup!.rotation.y += rotationSpeed),
      // KeyE: () => (playerGroup!.rotation.y -= rotationSpeed),
    };

    const target = new Vector3();
    // Animation Loop
    const animate = () => {
      requestAnimationFrame(animate);

      if (playerGroup) {
        const rotationY = playerGroup.rotation.y;
        Object.keys(keysPressed.current).forEach((key) => {
          if (keysPressed.current[key] && moveMap[key]) {
            engineLight1!.intensity = activeLightIntensity;
            engineLight2!.intensity = activeLightIntensity;
            engineLight3!.intensity = activeLightIntensity;
            engineLight4!.intensity = activeLightIntensity;
            engineLight5!.intensity = activeLightIntensity;

            curvedCylinder!.material.opacity = 0.7;

            moveMap[key](rotationY);
          }
        });

        for (let i = laserShots.length - 1; i >= 0; i--) {
          const shot = laserShots[i];
          shot.position.add((shot as any).velocity);

          // Remove after going too far
          if (shot.position.length() > 200) {
            scene.remove(shot);
            laserShots.splice(i, 1);
          }
        }

      }

      // controls.update();

// Smooth Follow Behavior (More Game-Like)
      if (mesh) {
        // Calculate desired camera position behind the ship
        const offset = new Vector3(0, 3, -10);
        offset.applyQuaternion(mesh.quaternion);
        const desiredPosition = mesh.position.clone().add(offset);

        // Smooth camera movement
        camera.position.lerp(desiredPosition, 0.1);

        // Look at the ship
        target.copy(mesh.position);
        camera.lookAt(target);
      }

      renderer.render(scene, camera);
    };
    animate();

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      // controls.dispose();
      renderer.dispose();
      containerRef.current?.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <>
      <div id="heading">
        <h1>THE MILLENNIUM FALCON</h1>
        <h2>Press W, A, S, D to move the ship | Press Arrow Up to ascend | Press Arrow Down to descend | Press Q to rotate left | Press E to rotate right | Press Space to fire laser</h2>
        <div className="border"></div>
      </div>
      <div ref={containerRef} style={{ width: '100%', height: '100vh', overflow: 'hidden' }} />
      <div id="progress-container" ref={progressRef}>
        <div id="progress">Engaging Hyperdrive...</div>
      </div>
    </>
  );
}
