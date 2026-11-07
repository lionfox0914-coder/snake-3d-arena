import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import {
  ActiveBuff,
  BotSnake,
  Coordinate,
  GameState,
  ItemType,
  MapItem,
  Particle,
  ThemeConfig,
} from '../types/game';
import { Camera, Eye, Video } from 'lucide-react';

interface SnakeCanvasProps {
  snakeRef: React.RefObject<Coordinate[]>;
  headAngleRef: React.RefObject<number>;
  botsRef: React.RefObject<BotSnake[]>;
  itemsRef: React.RefObject<MapItem[]>;
  particlesRef: React.RefObject<Particle[]>;
  activeBuffsRef: React.RefObject<ActiveBuff[]>;
  currentDistanceRef: React.RefObject<number>;
  theme: ThemeConfig;
  gameState: GameState;
  onPointerMoveAngle: (angle: number | null) => void;
  onCanvasClick?: () => void;
}

type CameraViewMode = 'CHASE_3D' | 'ISOMETRIC_3D' | 'TOPDOWN_3D';

// Reusable Three.js Math helpers outside render loop (Zero GC)
const _vec3 = new THREE.Vector3();
const _vec3B = new THREE.Vector3();
const _mat4 = new THREE.Matrix4();
const _quat = new THREE.Quaternion();
const _color = new THREE.Color();
const _pointer2D = new THREE.Vector2();
const _groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

// Helper to create a procedural sprite texture for bot name tags
function createNameTagTexture(name: string, color: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
  ctx.beginPath();
  ctx.roundRect(16, 12, 224, 40, 12);
  ctx.fill();

  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 20px "Plus Jakarta Sans", system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(name, 128, 32);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// Procedural ground grid texture
function createGridTexture(bgColor: string, gridColor: string): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, 256, 256);

  ctx.strokeStyle = gridColor;
  ctx.lineWidth = 2;
  ctx.strokeRect(0, 0, 256, 256);

  // Subtle cross center
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(128, 0);
  ctx.lineTo(128, 256);
  ctx.moveTo(0, 128);
  ctx.lineTo(256, 128);
  ctx.stroke();

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export const SnakeCanvas: React.FC<SnakeCanvasProps> = ({
  snakeRef,
  headAngleRef,
  botsRef,
  itemsRef,
  particlesRef,
  activeBuffsRef,
  currentDistanceRef,
  theme,
  gameState,
  onPointerMoveAngle,
  onCanvasClick,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [cameraMode, setCameraMode] = useState<CameraViewMode>('ISOMETRIC_3D');

  // Keep latest mutable props in refs for the 60fps render loop
  const themeRef = useRef<ThemeConfig>(theme);
  themeRef.current = theme;

  const gameStateRef = useRef<GameState>(gameState);
  gameStateRef.current = gameState;

  const cameraModeRef = useRef<CameraViewMode>(cameraMode);
  cameraModeRef.current = cameraMode;

  const pointerPosRef = useRef<{ x: number; y: number } | null>(null);

  // Raycaster for 360-degree mouse pointing onto 3D ground plane
  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster());
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = mountRef.current;
    if (!el || !cameraRef.current) return;
    const rect = el.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
    pointerPosRef.current = { x, y };

    // Intersect ray with ground plane (Y = 0)
    _pointer2D.set(x, y);
    raycasterRef.current.setFromCamera(_pointer2D, cameraRef.current);
    const hit = raycasterRef.current.ray.intersectPlane(_groundPlane, _vec3);
    if (hit) {
      const head = snakeRef.current?.[0] || { x: 0, y: 0 };
      const dx = hit.x - head.x;
      const dz = hit.z - head.y; // 2D y corresponds to 3D z
      if (Math.hypot(dx, dz) > 0.45) {
        const angle = Math.atan2(dz, dx);
        onPointerMoveAngle(angle);
      }
    }
  };

  const handlePointerLeave = () => {
    pointerPosRef.current = null;
  };

  // Main Three.js Scene Setup & Render Loop
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Detect Software WebGL
    const isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    // 1. Three.js Scene & Color Pipeline
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(themeRef.current.bgColor);
    scene.fog = new THREE.FogExp2(themeRef.current.bgColor, 0.016);

    const width = container.clientWidth || 540;
    const height = container.clientHeight || 540;

    const camera = new THREE.PerspectiveCamera(48, width / height, 0.2, 180);
    cameraRef.current = camera;
    camera.position.set(0, 20, 16);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.replaceChildren(renderer.domElement);
    renderer.domElement.className = 'w-full h-full block touch-none cursor-crosshair';

    // 2. Studio Environment Map (PBR Glossy Reflections)
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // 3. Studio Lighting Rig
    const hemiLight = new THREE.HemisphereLight(0xe0f2fe, 0x0f172a, 0.85);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xfffbeb, 1.8);
    dirLight.position.set(16, 32, 16);
    dirLight.castShadow = !isSoftwareGl;
    dirLight.shadow.mapSize.set(1024, 1024);
    dirLight.shadow.camera.near = 1;
    dirLight.shadow.camera.far = 80;
    dirLight.shadow.camera.left = -28;
    dirLight.shadow.camera.right = 28;
    dirLight.shadow.camera.top = 28;
    dirLight.shadow.camera.bottom = -28;
    dirLight.shadow.bias = -0.0004;
    dirLight.shadow.normalBias = 0.02;
    scene.add(dirLight);

    // Dynamic light tracking player
    const playerPointLight = new THREE.PointLight(0x34d399, 1.5, 14);
    playerPointLight.position.set(0, 3, 0);
    scene.add(playerPointLight);

    // 4. Infinite Ground Grid
    const groundSize = 180;
    const groundGeo = new THREE.PlaneGeometry(groundSize, groundSize, 1, 1);
    const gridTexture = createGridTexture(themeRef.current.boardBg, themeRef.current.gridLine);
    gridTexture.repeat.set(groundSize, groundSize);

    const groundMat = new THREE.MeshStandardMaterial({
      map: gridTexture,
      roughness: 0.85,
      metalness: 0.05,
    });
    const groundMesh = new THREE.Mesh(groundGeo, groundMat);
    groundMesh.rotation.x = -Math.PI / 2;
    groundMesh.receiveShadow = !isSoftwareGl;
    scene.add(groundMesh);

    // 5. World Origin (0,0) Beacon
    const originGroup = new THREE.Group();
    const originCylinder = new THREE.Mesh(
      new THREE.CylinderGeometry(0.8, 0.8, 0.15, 24),
      new THREE.MeshStandardMaterial({ color: 0x10b981, roughness: 0.3, metalness: 0.4 })
    );
    originCylinder.position.y = 0.08;
    originGroup.add(originCylinder);

    const originRing = new THREE.Mesh(
      new THREE.TorusGeometry(1.4, 0.05, 16, 32),
      new THREE.MeshBasicMaterial({ color: 0x34d399 })
    );
    originRing.rotation.x = Math.PI / 2;
    originRing.position.y = 0.1;
    originGroup.add(originRing);
    scene.add(originGroup);

    // 6. 3D Player Snake Meshes
    // Player Head: Composite procedural 3D model (Skull + 2 Eyes + 2 Pupils + Tongue + Buff Bubble)
    const playerHeadGroup = new THREE.Group();

    // Main skull
    const headMat = new THREE.MeshStandardMaterial({
      color: themeRef.current.snakeHead,
      roughness: 0.25,
      metalness: 0.2,
    });
    const headMesh = new THREE.Mesh(new THREE.SphereGeometry(0.52, 24, 20), headMat);
    headMesh.scale.set(1.15, 0.85, 1.0);
    headMesh.castShadow = !isSoftwareGl;
    playerHeadGroup.add(headMesh);

    // Eyes
    const eyeWhiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.1 });
    const eyePupilMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.05 });
    const eyeGeo = new THREE.SphereGeometry(0.14, 16, 12);
    const pupilGeo = new THREE.SphereGeometry(0.07, 12, 10);

    const leftEye = new THREE.Mesh(eyeGeo, eyeWhiteMat);
    leftEye.position.set(0.26, 0.22, 0.26);
    const leftPupil = new THREE.Mesh(pupilGeo, eyePupilMat);
    leftPupil.position.set(0.32, 0.24, 0.28);
    playerHeadGroup.add(leftEye, leftPupil);

    const rightEye = new THREE.Mesh(eyeGeo, eyeWhiteMat);
    rightEye.position.set(0.26, 0.22, -0.26);
    const rightPupil = new THREE.Mesh(pupilGeo, eyePupilMat);
    rightPupil.position.set(0.32, 0.24, -0.28);
    playerHeadGroup.add(rightEye, rightPupil);

    // Animated Red Tongue
    const tongueMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
    const tongueGeo = new THREE.BoxGeometry(0.4, 0.03, 0.08);
    const tongueMesh = new THREE.Mesh(tongueGeo, tongueMat);
    tongueMesh.position.set(0.68, 0, 0);
    playerHeadGroup.add(tongueMesh);

    // Translucent Glowing Buff Bubble Shell
    const auraMat = new THREE.MeshStandardMaterial({
      color: 0xc084fc,
      transparent: true,
      opacity: 0,
      roughness: 0.1,
      metalness: 0.8,
    });
    const auraMesh = new THREE.Mesh(new THREE.SphereGeometry(0.85, 20, 16), auraMat);
    playerHeadGroup.add(auraMesh);

    scene.add(playerHeadGroup);

    // Player Body Instanced Mesh (Up to 140 segments, 1 single draw call!)
    const maxPlayerSegments = 140;
    const playerSegmentGeo = new THREE.SphereGeometry(0.45, 18, 14);
    const playerSegmentMat = new THREE.MeshStandardMaterial({
      roughness: 0.28,
      metalness: 0.2,
    });
    const playerInstancedMesh = new THREE.InstancedMesh(
      playerSegmentGeo,
      playerSegmentMat,
      maxPlayerSegments
    );
    playerInstancedMesh.castShadow = !isSoftwareGl;
    playerInstancedMesh.receiveShadow = !isSoftwareGl;
    playerInstancedMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    scene.add(playerInstancedMesh);

    // 7. 3D Bot Snakes Pool
    const botMeshesMap = new Map<
      string,
      {
        headGroup: THREE.Group;
        headMesh: THREE.Mesh;
        instancedBody: THREE.InstancedMesh;
        nameSprite: THREE.Sprite;
        color: string;
      }
    >();

    // 8. 3D Map Items Pool
    const itemMeshesMap = new Map<
      string,
      {
        group: THREE.Group;
        type: ItemType;
        shadowMesh: THREE.Mesh;
      }
    >();

    // Shared item geometries & materials
    const appleGeo = new THREE.SphereGeometry(0.4, 18, 14);
    const stemGeo = new THREE.CylinderGeometry(0.03, 0.04, 0.28, 8);
    const leafGeo = new THREE.SphereGeometry(0.15, 8, 8);
    leafGeo.scale(1.8, 0.4, 0.9);

    const shadowGeo = new THREE.CircleGeometry(0.38, 16);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.25,
      depthWrite: false,
    });

    const create3DItemMesh = (type: ItemType): THREE.Group => {
      const g = new THREE.Group();

      if (type === 'APPLE' || type === 'GOLDEN') {
        const isGold = type === 'GOLDEN';
        const fruitMat = new THREE.MeshStandardMaterial({
          color: isGold ? 0xfacc15 : 0xef4444,
          roughness: isGold ? 0.15 : 0.25,
          metalness: isGold ? 0.85 : 0.1,
        });
        const fruit = new THREE.Mesh(appleGeo, fruitMat);
        fruit.scale.set(1, 0.88, 1);
        fruit.position.y = 0.45;
        fruit.castShadow = !isSoftwareGl;
        g.add(fruit);

        // Stem & Leaf
        const stem = new THREE.Mesh(
          stemGeo,
          new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.8 })
        );
        stem.position.set(0, 0.8, 0);
        stem.rotation.z = -0.2;
        g.add(stem);

        const leaf = new THREE.Mesh(
          leafGeo,
          new THREE.MeshStandardMaterial({ color: isGold ? 0xfef08a : 0x22c55e, roughness: 0.4 })
        );
        leaf.position.set(0.18, 0.84, 0);
        leaf.rotation.z = 0.35;
        g.add(leaf);

        if (isGold) {
          // Golden floating halo ring
          const ring = new THREE.Mesh(
            new THREE.TorusGeometry(0.55, 0.04, 12, 24),
            new THREE.MeshBasicMaterial({ color: 0xfef08a })
          );
          ring.rotation.x = Math.PI / 2;
          ring.position.y = 0.45;
          g.add(ring);
        }
      } else if (type === 'SLOW') {
        // Frost Berry (Faceted cyan crystal sphere)
        const iceMat = new THREE.MeshStandardMaterial({
          color: 0x38bdf8,
          roughness: 0.1,
          metalness: 0.3,
        });
        const ice = new THREE.Mesh(new THREE.IcosahedronGeometry(0.42, 1), iceMat);
        ice.position.y = 0.45;
        ice.castShadow = !isSoftwareGl;
        g.add(ice);
      } else if (type === 'SPEED') {
        // Speed Chili (Orange-red curved capsule)
        const chiliMat = new THREE.MeshStandardMaterial({
          color: 0xf97316,
          roughness: 0.2,
          metalness: 0.2,
        });
        const chili = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.35, 0.65, 12), chiliMat);
        chili.position.y = 0.45;
        chili.rotation.z = Math.PI / 6;
        chili.castShadow = !isSoftwareGl;
        g.add(chili);
      } else if (type === 'GHOST') {
        // Ghost Star (Glowing purple crystal)
        const ghostMat = new THREE.MeshStandardMaterial({
          color: 0xc084fc,
          roughness: 0.1,
          metalness: 0.6,
        });
        const star = new THREE.Mesh(new THREE.OctahedronGeometry(0.44, 0), ghostMat);
        star.position.y = 0.45;
        star.castShadow = !isSoftwareGl;
        g.add(star);
      } else if (type === 'SHRINK') {
        // Magic Mushroom
        const stalk = new THREE.Mesh(
          new THREE.CylinderGeometry(0.2, 0.25, 0.4, 12),
          new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.5 })
        );
        stalk.position.y = 0.25;
        g.add(stalk);

        const cap = new THREE.Mesh(
          new THREE.SphereGeometry(0.45, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2),
          new THREE.MeshStandardMaterial({ color: 0x10b981, roughness: 0.3 })
        );
        cap.position.y = 0.45;
        cap.castShadow = !isSoftwareGl;
        g.add(cap);
      }

      return g;
    };

    // 9. Particle Points in 3D
    const maxParticles = 200;
    const particlePositions = new Float32Array(maxParticles * 3);
    const particleColors = new Float32Array(maxParticles * 3);
    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    particleGeo.setAttribute('color', new THREE.BufferAttribute(particleColors, 3));

    const particleMat = new THREE.PointsMaterial({
      size: 0.32,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
    });
    const particlePoints = new THREE.Points(particleGeo, particleMat);
    scene.add(particlePoints);

    // Resize Observer
    const ro = new ResizeObserver(() => {
      const w = container.clientWidth || 540;
      const h = container.clientHeight || 540;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    });
    ro.observe(container);

    // 10. Main 60 FPS Render Loop
    let animId = 0;
    let time = 0;
    const camTarget = new THREE.Vector3(0, 0.5, 0);

    const render = () => {
      animId = requestAnimationFrame(render);
      time += 0.04;

      const currentTheme = themeRef.current;
      const currentGameState = gameStateRef.current;
      const snake = snakeRef.current || [];
      const bots = botsRef.current || [];
      const items = itemsRef.current || [];
      const particles = particlesRef.current || [];
      const activeBuffs = activeBuffsRef.current || [];
      const headAngle = headAngleRef.current ?? 0;
      const mode = cameraModeRef.current;

      const head = snake[0] || { x: 0, y: 0 };
      const playerGirth = 1.0 + Math.min(0.35, Math.max(0, snake.length - 10) * 0.006);

      // --- Camera Smooth Tracking in 3D ---
      if (Math.hypot(head.x - camTarget.x, head.y - camTarget.z) > 30) {
        camTarget.set(head.x, 0.5, head.y);
      } else {
        camTarget.x += (head.x - camTarget.x) * 0.14;
        camTarget.z += (head.y - camTarget.z) * 0.14;
      }

      if (mode === 'ISOMETRIC_3D') {
        // High-fidelity 52° tilted 3D arena view
        camera.position.x = camTarget.x;
        camera.position.y = 21;
        camera.position.z = camTarget.z + 16.5;
        camera.lookAt(camTarget.x, 0.4, camTarget.z);
      } else if (mode === 'TOPDOWN_3D') {
        // High altitude tactical top-down
        camera.position.x = camTarget.x;
        camera.position.y = 28;
        camera.position.z = camTarget.z + 4;
        camera.lookAt(camTarget.x, 0.4, camTarget.z);
      } else if (mode === 'CHASE_3D') {
        // Dynamic close behind-the-head chase view
        const chaseDist = 10;
        const chaseHeight = 6.5;
        const targetCamX = head.x - Math.cos(headAngle) * chaseDist;
        const targetCamZ = head.y - Math.sin(headAngle) * chaseDist;
        camera.position.x += (targetCamX - camera.position.x) * 0.12;
        camera.position.y += (chaseHeight - camera.position.y) * 0.12;
        camera.position.z += (targetCamZ - camera.position.z) * 0.12;
        camera.lookAt(head.x + Math.cos(headAngle) * 4, 1.0, head.y + Math.sin(headAngle) * 4);
      }

      // Update light & ground position to stay centered on camera
      dirLight.position.set(camTarget.x + 16, 32, camTarget.z + 16);
      dirLight.target.position.set(camTarget.x, 0, camTarget.z);
      dirLight.target.updateMatrixWorld();

      playerPointLight.position.set(head.x, 2.8, head.y);

      // Infinite ground follows camera seamlessly
      groundMesh.position.set(Math.floor(camTarget.x), 0, Math.floor(camTarget.z));
      gridTexture.offset.set(
        (camTarget.x - Math.floor(camTarget.x)),
        -(camTarget.z - Math.floor(camTarget.z))
      );

      // --- Update 3D Player Snake ---
      if (snake.length > 0) {
        playerHeadGroup.position.set(head.x, 0.5 * playerGirth, head.y);
        playerHeadGroup.rotation.y = -headAngle;
        playerHeadGroup.scale.setScalar(playerGirth);

        // Tongue flick
        const tongueCycle = Math.sin(time * 9);
        tongueMesh.visible = tongueCycle > 0.35 && currentGameState === 'PLAYING';
        if (tongueMesh.visible) {
          tongueMesh.position.x = 0.65 + tongueCycle * 0.15;
        }

        // Active Buff Glow Aura
        const hasGhost = activeBuffs.some((b) => b.type === 'GHOST');
        const hasSpeed = activeBuffs.some((b) => b.type === 'SPEED');
        const hasSlow = activeBuffs.some((b) => b.type === 'SLOW');

        if (hasGhost) {
          auraMat.color.setHex(0xc084fc);
          auraMat.opacity = 0.45 + Math.sin(time * 6) * 0.15;
          auraMesh.visible = true;
        } else if (hasSpeed) {
          auraMat.color.setHex(0xf97316);
          auraMat.opacity = 0.45;
          auraMesh.visible = true;
        } else if (hasSlow) {
          auraMat.color.setHex(0x38bdf8);
          auraMat.opacity = 0.4;
          auraMesh.visible = true;
        } else {
          auraMesh.visible = false;
        }

        // Render Volumetric Body Segments via InstancedMesh
        const bodyCount = Math.min(maxPlayerSegments, snake.length - 1);
        playerInstancedMesh.count = bodyCount;

        const colorStart = _color.set(currentTheme.snakeBodyStart);
        const colorEnd = _color.clone().set(currentTheme.snakeBodyEnd);

        for (let i = 1; i <= bodyCount; i++) {
          const seg = snake[i];
          const progress = i / Math.max(1, snake.length - 1);
          const r = Math.max(0.18, 0.44 * playerGirth * (1 - progress * 0.28));

          _vec3.set(seg.x, r, seg.y);
          _quat.set(0, 0, 0, 1);
          _vec3B.set(r * 2.1, r * 2.0, r * 2.1);
          _mat4.compose(_vec3, _quat, _vec3B);

          playerInstancedMesh.setMatrixAt(i - 1, _mat4);
          playerInstancedMesh.setColorAt(i - 1, i % 2 === 0 ? colorStart : colorEnd);
        }
        playerInstancedMesh.instanceMatrix.needsUpdate = true;
        if (playerInstancedMesh.instanceColor) playerInstancedMesh.instanceColor.needsUpdate = true;
      } else {
        playerInstancedMesh.count = 0;
      }

      // --- Update 3D AI Bot Snakes ---
      const activeBotIds = new Set(bots.map((b) => b.id));

      // Remove defunct bot meshes
      for (const [id, data] of botMeshesMap.entries()) {
        if (!activeBotIds.has(id)) {
          scene.remove(data.headGroup);
          scene.remove(data.instancedBody);
          botMeshesMap.delete(id);
        }
      }

      // Update / Create bot meshes
      for (let b = 0; b < bots.length; b++) {
        const bot = bots[b];
        if (!bot.segments || bot.segments.length === 0) continue;

        let botData = botMeshesMap.get(bot.id);
        if (!botData) {
          // Create 3D Bot Head
          const headGroup = new THREE.Group();
          const bHeadMat = new THREE.MeshStandardMaterial({
            color: bot.headColor,
            roughness: 0.3,
            metalness: 0.2,
          });
          const bHeadMesh = new THREE.Mesh(new THREE.SphereGeometry(0.5, 18, 14), bHeadMat);
          bHeadMesh.scale.set(1.1, 0.85, 1.0);
          bHeadMesh.castShadow = !isSoftwareGl;
          headGroup.add(bHeadMesh);

          // Bot Eyes
          const bLeftEye = new THREE.Mesh(eyeGeo, eyeWhiteMat);
          bLeftEye.position.set(0.24, 0.2, 0.24);
          const bLeftPupil = new THREE.Mesh(pupilGeo, eyePupilMat);
          bLeftPupil.position.set(0.3, 0.22, 0.26);
          headGroup.add(bLeftEye, bLeftPupil);

          const bRightEye = new THREE.Mesh(eyeGeo, eyeWhiteMat);
          bRightEye.position.set(0.24, 0.2, -0.24);
          const bRightPupil = new THREE.Mesh(pupilGeo, eyePupilMat);
          bRightPupil.position.set(0.3, 0.22, -0.26);
          headGroup.add(bRightEye, bRightPupil);

          // 3D Floating Name Tag Sprite
          const tagTexture = createNameTagTexture(bot.name, bot.color);
          const tagMat = new THREE.SpriteMaterial({ map: tagTexture, transparent: true });
          const tagSprite = new THREE.Sprite(tagMat);
          tagSprite.scale.set(3.2, 0.8, 1);
          tagSprite.position.set(0, 1.6, 0);
          headGroup.add(tagSprite);

          // Bot Body Instanced Mesh
          const bBodyMat = new THREE.MeshStandardMaterial({
            color: bot.color,
            roughness: 0.32,
            metalness: 0.15,
          });
          const instancedBody = new THREE.InstancedMesh(playerSegmentGeo, bBodyMat, 50);
          instancedBody.castShadow = !isSoftwareGl;
          instancedBody.receiveShadow = !isSoftwareGl;

          scene.add(headGroup);
          scene.add(instancedBody);

          botData = {
            headGroup,
            headMesh: bHeadMesh,
            instancedBody,
            nameSprite: tagSprite,
            color: bot.color,
          };
          botMeshesMap.set(bot.id, botData);
        }

        const bHead = bot.segments[0];
        const botGirth = 1.0 + Math.min(0.35, Math.max(0, bot.segments.length - 8) * 0.008);

        botData.headGroup.position.set(bHead.x, 0.48 * botGirth, bHead.y);
        botData.headGroup.rotation.y = -bot.angle;
        botData.headGroup.scale.setScalar(botGirth);

        // Update bot body segments
        const bCount = Math.min(50, bot.segments.length - 1);
        botData.instancedBody.count = bCount;

        for (let i = 1; i <= bCount; i++) {
          const seg = bot.segments[i];
          const progress = i / Math.max(1, bot.segments.length - 1);
          const r = Math.max(0.16, 0.42 * botGirth * (1 - progress * 0.28));

          _vec3.set(seg.x, r, seg.y);
          _quat.set(0, 0, 0, 1);
          _vec3B.set(r * 2.0, r * 1.9, r * 2.0);
          _mat4.compose(_vec3, _quat, _vec3B);

          botData.instancedBody.setMatrixAt(i - 1, _mat4);
        }
        botData.instancedBody.instanceMatrix.needsUpdate = true;
      }

      // --- Update 3D Map Items ---
      const activeItemIds = new Set(items.map((i) => i.id));

      // Remove collected items
      for (const [id, data] of itemMeshesMap.entries()) {
        if (!activeItemIds.has(id)) {
          scene.remove(data.group);
          scene.remove(data.shadowMesh);
          itemMeshesMap.delete(id);
        }
      }

      // Create / Animate items
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        let itemData = itemMeshesMap.get(item.id);

        if (!itemData) {
          const group = create3DItemMesh(item.type);
          const sMesh = new THREE.Mesh(shadowGeo, shadowMat);
          sMesh.rotation.x = -Math.PI / 2;
          sMesh.position.y = 0.02;

          scene.add(group);
          scene.add(sMesh);

          itemData = { group, type: item.type, shadowMesh: sMesh };
          itemMeshesMap.set(item.id, itemData);
        }

        // Bobbing & rotating in 3D space
        const bob = Math.sin(time * 3 + (item.type === 'GOLDEN' ? 1 : 0)) * 0.12;
        itemData.group.position.set(item.position.x, bob, item.position.y);
        itemData.group.rotation.y += 0.025;

        itemData.shadowMesh.position.set(item.position.x, 0.02, item.position.y);
        const shadowScale = 1 - bob * 1.5;
        itemData.shadowMesh.scale.set(shadowScale, shadowScale, shadowScale);
      }

      // --- Update 3D Particles ---
      let pActiveCount = 0;
      for (let pIdx = 0; pIdx < Math.min(maxParticles, particles.length); pIdx++) {
        const p = particles[pIdx];
        if (p.alpha <= 0) continue;

        particlePositions[pActiveCount * 3] = p.x;
        particlePositions[pActiveCount * 3 + 1] = 0.4 + (1 - p.alpha) * 1.6;
        particlePositions[pActiveCount * 3 + 2] = p.y;

        _color.set(p.color);
        particleColors[pActiveCount * 3] = _color.r;
        particleColors[pActiveCount * 3 + 1] = _color.g;
        particleColors[pActiveCount * 3 + 2] = _color.b;

        pActiveCount++;
      }
      particleGeo.setDrawRange(0, pActiveCount);
      particleGeo.attributes.position.needsUpdate = true;
      particleGeo.attributes.color.needsUpdate = true;

      // Render Three.js frame
      renderer.render(scene, camera);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      ro.disconnect();
      renderer.dispose();
      scene.clear();
    };
  }, [snakeRef, headAngleRef, botsRef, itemsRef, particlesRef, activeBuffsRef, currentDistanceRef]);

  return (
    <div
      onClick={onCanvasClick}
      className="relative w-full aspect-square max-w-[540px] mx-auto rounded-xl overflow-hidden shadow-2xl border border-slate-800 bg-slate-950 flex items-center justify-center select-none"
    >
      {/* 3D WebGL Canvas Container */}
      <div
        ref={mountRef}
        onPointerDown={handlePointerMove}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        className="w-full h-full block"
      />

      {/* 3D Camera View Mode Floating Dock (Bottom Right) */}
      <div className="absolute top-3 right-3 flex items-center gap-1.5 p-1 bg-slate-900/85 backdrop-blur-sm border border-slate-700/80 rounded-lg shadow-lg z-10">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setCameraMode('ISOMETRIC_3D');
          }}
          title="3D 斜角立體視角"
          className={`flex items-center gap-1 px-2 py-1 text-[11px] font-semibold rounded-md transition-all ${
            cameraMode === 'ISOMETRIC_3D'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <Camera className="w-3 h-3" />
          <span>3D立體</span>
        </button>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setCameraMode('TOPDOWN_3D');
          }}
          title="3D 戰術俯瞰視角"
          className={`flex items-center gap-1 px-2 py-1 text-[11px] font-semibold rounded-md transition-all ${
            cameraMode === 'TOPDOWN_3D'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <Eye className="w-3 h-3" />
          <span>戰術俯瞰</span>
        </button>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setCameraMode('CHASE_3D');
          }}
          title="3D 追尾衝刺視角"
          className={`flex items-center gap-1 px-2 py-1 text-[11px] font-semibold rounded-md transition-all ${
            cameraMode === 'CHASE_3D'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <Video className="w-3 h-3" />
          <span>追尾視角</span>
        </button>
      </div>

      {/* 3D Origin & Exploration Coordinates Overlay (Top Left) */}
      <div className="absolute top-3 left-3 flex items-center gap-2 px-2.5 py-1 bg-slate-900/85 backdrop-blur-sm border border-slate-700/80 rounded-lg shadow-lg text-[11px] font-mono pointer-events-none z-10">
        <span className="text-emerald-400 font-bold">3D ARENA</span>
        <span className="text-slate-400">|</span>
        <span className="text-sky-300 font-bold">{currentDistanceRef.current}m</span>
      </div>

      {/* Paused Overlay */}
      {gameState === 'PAUSED' && (
        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center space-y-2 z-20">
          <div className="text-2xl font-black text-white">遊戲已暫停</div>
          <div className="text-xs text-slate-400 font-medium">按 空白鍵 或 點擊畫布繼續對決</div>
        </div>
      )}
    </div>
  );
};
