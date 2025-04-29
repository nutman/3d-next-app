'use client';

import { useEffect, useRef } from 'react';
import {
  DoubleSide,
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

export default function Home() {
  const containerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);

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

    // Animation Loop
    const animate = () => {
      requestAnimationFrame(animate);
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
        <div className="border"></div>
      </div>
      <div ref={containerRef} style={{ width: '100%', height: '100vh', overflow: 'hidden' }} />
      <div id="progress-container" ref={progressRef}>
        <div id="progress">Engaging Hyperdrive...</div>
      </div>
    </>
  );
}
