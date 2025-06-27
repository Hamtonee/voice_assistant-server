// AnimatedCoach.js
import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import '../assets/styles/AnimatedCoach.css'; // Import the CSS file

const AnimatedCoach = ({ isListening, isSpeaking, useProcedural = false }) => {
  const mountRef = useRef(null);
  const mixerRef = useRef(null);
  const listeningActionRef = useRef(null);
  const speakingActionRef = useRef(null);

  useEffect(() => {
    // Set up the scene, camera, and renderer.
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      mountRef.current.clientWidth / mountRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.z = 3;
    
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    mountRef.current.appendChild(renderer.domElement);
    
    // Add ambient and directional lighting.
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(0, 1, 1);
    scene.add(directionalLight);
    
    // Function to create a procedural dog from basic geometries.
    const createProceduralDog = () => {
      const dog = new THREE.Group();

      // Body.
      const bodyGeometry = new THREE.BoxGeometry(1, 0.5, 0.3);
      const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x8b4513 });
      const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
      body.position.y = 0.5;
      dog.add(body);

      // Head.
      const headGeometry = new THREE.SphereGeometry(0.3, 32, 32);
      const headMaterial = new THREE.MeshStandardMaterial({ color: 0x8b4513 });
      const head = new THREE.Mesh(headGeometry, headMaterial);
      head.position.set(0.7, 0.8, 0);
      dog.add(head);

      // Legs.
      const legGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.5, 16);
      const legMaterial = new THREE.MeshStandardMaterial({ color: 0x8b4513 });
      const legPositions = [
        [0.3, 0.25, 0.1],
        [0.3, 0.25, -0.1],
        [-0.3, 0.25, 0.1],
        [-0.3, 0.25, -0.1]
      ];
      legPositions.forEach(pos => {
        const leg = new THREE.Mesh(legGeometry, legMaterial);
        leg.position.set(pos[0], pos[1], pos[2]);
        dog.add(leg);
      });

      // Tail.
      const tailGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.4, 16);
      const tailMaterial = new THREE.MeshStandardMaterial({ color: 0x8b4513 });
      const tail = new THREE.Mesh(tailGeometry, tailMaterial);
      tail.position.set(-0.55, 0.8, 0);
      tail.rotation.z = Math.PI / 4;
      dog.add(tail);

      scene.add(dog);

      // Animate the tail wagging.
      let tailWagDirection = 1;
      const clockProc = new THREE.Clock();
      const animateProc = () => {
        requestAnimationFrame(animateProc);
        const delta = clockProc.getDelta();
        tail.rotation.z += delta * tailWagDirection;
        if (tail.rotation.z > (Math.PI / 3) || tail.rotation.z < (Math.PI / 4)) {
          tailWagDirection *= -1;
        }
        renderer.render(scene, camera);
      };
      animateProc();
    };

    // Use GLTFLoader unless we're forcing procedural or the model load fails.
    if (!useProcedural) {
      const loader = new GLTFLoader();
      loader.load(
        '/models/dog_coach.glb',
        (gltf) => {
          const model = gltf.scene;
          scene.add(model);

          // Ensure at least two animations: one for listening and one for speaking.
          if (gltf.animations && gltf.animations.length >= 2) {
            const mixer = new THREE.AnimationMixer(model);
            mixerRef.current = mixer;
            listeningActionRef.current = mixer.clipAction(gltf.animations[0]);
            speakingActionRef.current = mixer.clipAction(gltf.animations[1]);

            // Start both animations but keep them paused initially.
            listeningActionRef.current.play();
            listeningActionRef.current.paused = true;

            speakingActionRef.current.play();
            speakingActionRef.current.paused = true;
          }
        },
        undefined,
        (error) => {
          console.error('Error loading GLTF model, falling back to procedural dog:', error);
          createProceduralDog();
        }
      );
    } else {
      createProceduralDog();
    }

    // Animation loop for model (if loaded via GLTF) – note that procedural animation has its own loop.
    const clock = new THREE.Clock();
    const animate = () => {
      requestAnimationFrame(animate);
      if (mixerRef.current) {
        mixerRef.current.update(clock.getDelta());
      }
      renderer.render(scene, camera);
    };
    animate();

    // Cleanup when component unmounts.
    return () => {
      const currentMount = mountRef.current;
      if (
        currentMount &&
        renderer.domElement &&
        renderer.domElement.parentNode === currentMount
      ) {
        currentMount.removeChild(renderer.domElement);
      }
    };
  }, [useProcedural]);

  // Control the listening animation based on the isListening prop.
  useEffect(() => {
    if (listeningActionRef.current) {
      listeningActionRef.current.paused = !isListening;
    }
  }, [isListening]);

  // Control the speaking animation based on the isSpeaking prop.
  useEffect(() => {
    if (speakingActionRef.current) {
      speakingActionRef.current.paused = !isSpeaking;
    }
  }, [isSpeaking]);

  return <div ref={mountRef} className="animated-coach-container"></div>;
};

export default AnimatedCoach;
