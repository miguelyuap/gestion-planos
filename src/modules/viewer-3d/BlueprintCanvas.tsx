'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { GeneratedBlueprint, Part3D } from '../blueprint-engine/types';

export type CameraViewPreset = 'perspective' | 'front' | 'side' | 'top';

export interface BlueprintCanvasProps {
  blueprint: GeneratedBlueprint;
  cameraView: CameraViewPreset;
  xrayMode: boolean;
  openFronts: boolean;
  explosionFactor: number;
  showDimensions: boolean;
  selectedPartId: string | null;
  onSelectPart: (part: Part3D | null) => void;
}

interface ProjectedLabel {
  id: string;
  label: string;
  valueFormatted: string;
  colorHex: string;
  x: number;
  y: number;
  visible: boolean;
}

export function BlueprintCanvas({
  blueprint,
  cameraView,
  xrayMode,
  openFronts,
  explosionFactor,
  showDimensions,
  selectedPartId,
  onSelectPart,
}: BlueprintCanvasProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const partsGroupRef = useRef<THREE.Group | null>(null);
  const dimsGroupRef = useRef<THREE.Group | null>(null);
  const meshMapRef = useRef<Map<string, Part3D>>(new Map());
  const pointerDownPosRef = useRef<{ x: number; y: number } | null>(null);

  const [projectedLabels, setProjectedLabels] = useState<ProjectedLabel[]>([]);

  const updateProjectedDimensionLabels = useCallback(() => {
    const container = containerRef.current;
    const camera = cameraRef.current;
    if (!container || !camera || !showDimensions) {
      setProjectedLabels([]);
      return;
    }

    const width = container.clientWidth;
    const height = container.clientHeight;
    if (width === 0 || height === 0) return;

    const nextLabels: ProjectedLabel[] = blueprint.dimensions.map((dim) => {
      const mid = new THREE.Vector3(
        (dim.startM[0] + dim.endM[0]) / 2,
        (dim.startM[1] + dim.endM[1]) / 2,
        (dim.startM[2] + dim.endM[2]) / 2
      );
      mid.project(camera);

      const isBehind = mid.z > 1;
      const screenX = (mid.x * 0.5 + 0.5) * width;
      const screenY = (-(mid.y * 0.5) + 0.5) * height;

      return {
        id: dim.id,
        label: dim.label,
        valueFormatted: dim.valueFormatted,
        colorHex: dim.colorHex,
        x: screenX,
        y: screenY,
        visible:
          !isBehind &&
          screenX >= 16 &&
          screenX <= width - 16 &&
          screenY >= 16 &&
          screenY <= height - 16,
      };
    });

    setProjectedLabels(nextLabels);
  }, [blueprint.dimensions, showDimensions]);

  // 1. Initialize Three.js WebGL Scene, Camera, Lights, Touch Controls & ResizeObserver
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#0b1120');
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(
      42,
      container.clientWidth / Math.max(1, container.clientHeight),
      0.05,
      150
    );
    camera.position.set(4.2, 3.2, 4.8);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      preserveDrawingBuffer: true,
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.maxPolarAngle = Math.PI / 2 + 0.08;
    controls.minDistance = 0.6;
    controls.maxDistance = 60;
    controls.touches = {
      ONE: THREE.TOUCH.ROTATE,
      TWO: THREE.TOUCH.DOLLY_PAN,
    };
    controlsRef.current = controls;

    // Studio & Technical CAD Lighting
    const ambientLight = new THREE.AmbientLight('#ffffff', 0.85);
    scene.add(ambientLight);

    const dirLightMain = new THREE.DirectionalLight('#f8fafc', 1.25);
    dirLightMain.position.set(10, 18, 12);
    dirLightMain.castShadow = true;
    scene.add(dirLightMain);

    const dirLightFill = new THREE.DirectionalLight('#93c5fd', 0.55);
    dirLightFill.position.set(-10, 8, -10);
    scene.add(dirLightFill);

    // Metric CAD Grid Floor
    const grid = new THREE.GridHelper(24, 48, '#1e3a8a', '#1e293b');
    grid.position.y = -0.002;
    scene.add(grid);

    const partsGroup = new THREE.Group();
    scene.add(partsGroup);
    partsGroupRef.current = partsGroup;

    const dimsGroup = new THREE.Group();
    scene.add(dimsGroup);
    dimsGroupRef.current = dimsGroup;

    let animFrameId = 0;
    const animate = () => {
      animFrameId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const handleControlChange = () => {
      updateProjectedDimensionLabels();
    };
    controls.addEventListener('change', handleControlChange);

    const handleResize = () => {
      if (!containerRef.current || !rendererRef.current || !cameraRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      if (w === 0 || h === 0) return;
      cameraRef.current.aspect = w / Math.max(1, h);
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
      updateProjectedDimensionLabels();
    };

    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });
    resizeObserver.observe(container);
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animFrameId);
      controls.removeEventListener('change', handleControlChange);
      resizeObserver.disconnect();
      window.removeEventListener('resize', handleResize);
      controls.dispose();
      renderer.dispose();
    };
  }, [updateProjectedDimensionLabels]);

  // 2. Rebuild 3D Parts & Dimension Lines whenever Blueprint or Display Modes change
  useEffect(() => {
    const partsGroup = partsGroupRef.current;
    const dimsGroup = dimsGroupRef.current;
    if (!partsGroup || !dimsGroup) return;

    partsGroup.clear();
    dimsGroup.clear();
    meshMapRef.current.clear();

    const centerY = blueprint.boundingBoxM.heightY / 2;
    const modelCenter = new THREE.Vector3(0, centerY, 0);

    for (const part of blueprint.parts) {
      const [sx, sy, sz] = part.sizeM;
      const geometry =
        part.shape === 'cylinder'
          ? new THREE.CylinderGeometry(sx / 2, sx / 2, sy, 24)
          : new THREE.BoxGeometry(sx, sy, sz);

      const isSelected = selectedPartId === part.id;
      const isOuterCoverOrFront = part.layer === 'cover' || part.layer === 'front';

      let effectiveOpacity = part.opacity;
      if (xrayMode) {
        effectiveOpacity = isOuterCoverOrFront ? 0.22 : 0.78;
      }

      const material = new THREE.MeshStandardMaterial({
        color: new THREE.Color(isSelected ? '#38bdf8' : part.colorHex),
        metalness: part.metalness,
        roughness: part.roughness,
        transparent: effectiveOpacity < 1,
        opacity: effectiveOpacity,
        emissive: new THREE.Color(isSelected ? '#0284c7' : '#000000'),
        emissiveIntensity: isSelected ? 0.35 : 0,
      });

      const mesh = new THREE.Mesh(geometry, material);
      mesh.userData = { partId: part.id };

      let px = part.positionM[0];
      let py = part.positionM[1];
      let pz = part.positionM[2];

      const rx = part.rotationRad[0];
      let ry = part.rotationRad[1];
      const rz = part.rotationRad[2];

      if (openFronts && part.openTransform) {
        if (part.openTransform.translateM) {
          px += part.openTransform.translateM[0];
          py += part.openTransform.translateM[1];
          pz += part.openTransform.translateM[2];
        }
        if (part.openTransform.rotateYRad) {
          ry += part.openTransform.rotateYRad;
        }
      }

      if (explosionFactor > 0.01) {
        const dir = new THREE.Vector3(px, py, pz).sub(modelCenter);
        if (dir.lengthSq() > 0.0001) {
          dir.normalize();
          const maxSpan = Math.max(
            blueprint.boundingBoxM.widthX,
            blueprint.boundingBoxM.heightY,
            blueprint.boundingBoxM.depthZ
          );
          const dist = explosionFactor * maxSpan * 0.45;
          px += dir.x * dist;
          py += Math.max(0, dir.y * dist * 0.7);
          pz += dir.z * dist;
        }
      }

      mesh.position.set(px, py, pz);
      mesh.rotation.set(rx, ry, rz);

      const edgesGeo = new THREE.EdgesGeometry(geometry);
      const edgeMat = new THREE.LineBasicMaterial({
        color: isSelected ? '#7dd3fc' : xrayMode ? '#60a5fa' : '#0f172a',
        transparent: true,
        opacity: isSelected ? 1 : xrayMode ? 0.85 : 0.55,
      });
      const edgeLines = new THREE.LineSegments(edgesGeo, edgeMat);
      mesh.add(edgeLines);

      partsGroup.add(mesh);
      meshMapRef.current.set(part.id, part);
    }

    if (showDimensions) {
      for (const dim of blueprint.dimensions) {
        const startVec = new THREE.Vector3(...dim.startM);
        const endVec = new THREE.Vector3(...dim.endM);

        const lineGeo = new THREE.BufferGeometry().setFromPoints([startVec, endVec]);
        const lineMat = new THREE.LineBasicMaterial({
          color: dim.colorHex,
          linewidth: 2,
        });
        const lineObj = new THREE.Line(lineGeo, lineMat);
        dimsGroup.add(lineObj);

        const markerGeo = new THREE.SphereGeometry(0.025, 10, 10);
        const markerMat = new THREE.MeshBasicMaterial({ color: dim.colorHex });

        const startMarker = new THREE.Mesh(markerGeo, markerMat);
        startMarker.position.copy(startVec);
        dimsGroup.add(startMarker);

        const endMarker = new THREE.Mesh(markerGeo, markerMat);
        endMarker.position.copy(endVec);
        dimsGroup.add(endMarker);
      }
    }

    updateProjectedDimensionLabels();
  }, [
    blueprint,
    xrayMode,
    openFronts,
    explosionFactor,
    showDimensions,
    selectedPartId,
    updateProjectedDimensionLabels,
  ]);

  // 3. Position Camera when Blueprint size or CameraViewPreset changes
  useEffect(() => {
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (!camera || !controls) return;

    const { widthX, heightY, depthZ } = blueprint.boundingBoxM;
    const maxDim = Math.max(widthX, heightY, depthZ, 1.2);
    const targetY = heightY * 0.48;
    const dist = maxDim * 1.65;

    controls.target.set(0, targetY, 0);

    if (cameraView === 'front') {
      camera.position.set(0, targetY, dist * 1.15);
    } else if (cameraView === 'side') {
      camera.position.set(dist * 1.15, targetY, 0);
    } else if (cameraView === 'top') {
      camera.position.set(0, targetY + dist * 1.35, 0.01);
    } else {
      camera.position.set(dist * 0.85, targetY + dist * 0.55, dist * 0.95);
    }

    camera.updateProjectionMatrix();
    controls.update();
    updateProjectedDimensionLabels();
  }, [
    blueprint.category,
    blueprint.boundingBoxM.widthX,
    blueprint.boundingBoxM.heightY,
    blueprint.boundingBoxM.depthZ,
    cameraView,
    updateProjectedDimensionLabels,
  ]);

  // 4. Touch-safe & Drag-safe Pointer Tap Detection for Inspecting 3D Parts
  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    pointerDownPosRef.current = { x: event.clientX, y: event.clientY };
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    const downPos = pointerDownPosRef.current;
    pointerDownPosRef.current = null;
    if (!downPos) return;

    const moveDist = Math.hypot(
      event.clientX - downPos.x,
      event.clientY - downPos.y
    );
    // Ignore orbit/pan gestures (only select part on clean tap/click < 6px)
    if (moveDist > 6) return;

    const container = containerRef.current;
    const camera = cameraRef.current;
    const partsGroup = partsGroupRef.current;
    if (!container || !camera || !partsGroup) return;

    const rect = container.getBoundingClientRect();
    const mouse = new THREE.Vector2(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1
    );

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);

    const intersects = raycaster.intersectObjects(partsGroup.children, false);
    if (intersects.length > 0) {
      const hitMesh = intersects[0].object;
      const partId = hitMesh.userData?.partId as string | undefined;
      if (partId) {
        const found = meshMapRef.current.get(partId) ?? null;
        onSelectPart(found);
        return;
      }
    }
    onSelectPart(null);
  };

  return (
    <div className="relative w-full h-full select-none overflow-hidden bg-slate-950">
      {/* WebGL Canvas Mount with touch-none for smooth 1-finger orbit & 2-finger pinch zoom */}
      <div
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        className="w-full h-full touch-none cursor-grab active:cursor-grabbing"
      />

      {/* Floating 3D Projected Dimension Callouts (Cotas) */}
      {showDimensions && (
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {projectedLabels.map(
            (lbl) =>
              lbl.visible && (
                <div
                  key={lbl.id}
                  style={{
                    transform: `translate3d(${lbl.x}px, ${lbl.y}px, 0) translate(-50%, -50%)`,
                    borderColor: lbl.colorHex,
                  }}
                  className="
                    absolute left-0 top-0 px-1.5 sm:px-2 py-0.5 rounded-md
                    bg-slate-900/90 backdrop-blur-sm border text-[10px] sm:text-[11px]
                    font-mono font-semibold text-slate-100 shadow-lg whitespace-nowrap
                  "
                >
                  <span className="text-slate-400 mr-1 font-sans font-normal hidden sm:inline">
                    {lbl.label}:
                  </span>
                  <span style={{ color: lbl.colorHex }}>{lbl.valueFormatted}</span>
                </div>
              )
          )}
        </div>
      )}
    </div>
  );
}
