'use client';

import { useEffect, useRef } from 'react';
import {
  DoubleSide, Group,
  Mesh,
  MeshStandardMaterial,
  PCFSoftShadowMap,
  PerspectiveCamera,
  PlaneGeometry,
  Scene,
  SpotLight,
  SRGBColorSpace,
  Vector3,
  WebGLRenderer
} from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const speed = 0.1;
const minY = 1.05;
const rotationSpeed = 0.03;

export default function Home() {
  const containerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  const keysPressed = useRef<{ [key: string]: boolean }>({});
  let playerGroup: Group | null = null;

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      event.preventDefault();
      keysPressed.current[event.key.toLowerCase()] = true;
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      event.preventDefault();
      keysPressed.current[event.key.toLowerCase()] = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

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
    const scene = new Scene();
    const camera = new PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 1000);
    camera.position.set(4, 5, 11);

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.enablePan = false;
    controls.minDistance = 5;
    controls.maxDistance = 20;
    controls.minPolarAngle = 0.5;
    controls.maxPolarAngle = 1.5;
    controls.autoRotate = false;
    controls.target = new Vector3(0, 1, 0);
    controls.update();

    // Ground
    const groundGeometry = new PlaneGeometry(20, 20, 32, 32);
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
    const spotLight = new SpotLight(0xffffff, 3000, 100, 0.22, 1);
    spotLight.position.set(0, 25, 0);
    spotLight.castShadow = true;
    spotLight.shadow.bias = -0.0001;
    scene.add(spotLight);

    // Model
    const loader = new GLTFLoader().setPath('millennium_falcon/');
    loader.load('scene.gltf', (gltf) => {
      console.log('loading model');
      const mesh = gltf.scene;

      mesh.traverse((child) => {
        if ((child as Mesh).isMesh) {
          (child as Mesh).castShadow = true;
          (child as Mesh).receiveShadow = true;
        }
      });

      mesh.position.set(0, 1.05, -1);
      scene.add(mesh);

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
      w: (rotationY: number) => {
        playerGroup!.position.x += Math.sin(rotationY) * speed;
        playerGroup!.position.z += Math.cos(rotationY) * speed;
      },
      s: (rotationY: number) => {
        playerGroup!.position.x -= Math.sin(rotationY) * speed;
        playerGroup!.position.z -= Math.cos(rotationY) * speed;
      },
      a: (rotationY: number) => {
        playerGroup!.position.x += Math.cos(rotationY) * speed;
        playerGroup!.position.z -= Math.sin(rotationY) * speed;
      },
      d: (rotationY: number) => {
        playerGroup!.position.x -= Math.cos(rotationY) * speed;
        playerGroup!.position.z += Math.sin(rotationY) * speed;
      },
      arrowup: () => (playerGroup!.position.y += speed),
      arrowdown: () => (playerGroup!.position.y = Math.max(playerGroup!.position.y - speed, minY)),
      q: () => (playerGroup!.rotation.y += rotationSpeed),
      e: () => (playerGroup!.rotation.y -= rotationSpeed),
    };


    // Animation Loop
    const animate = () => {
      requestAnimationFrame(animate);

      if (playerGroup) {
        const rotationY = playerGroup.rotation.y;
        Object.keys(keysPressed.current).forEach((key) => {
          if (keysPressed.current[key] && moveMap[key]) {
            moveMap[key](rotationY);
          }
        });
      }

      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      controls.dispose();
      renderer.dispose();
      containerRef.current?.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <>
      <div id="heading">
        <h1>THE MILLENNIUM FALCON</h1>
        <h2>Press W, A, S, D to move the ship | Press Arrow Up to ascend | Press Arrow Down to descend</h2>
        <div className="border"></div>
      </div>
      <div ref={containerRef} style={{ width: '100%', height: '100vh', overflow: 'hidden' }} />
      <div id="progress-container" ref={progressRef}>
        <div id="progress">Engaging Hyperdrive...</div>
      </div>
    </>
  );
}
