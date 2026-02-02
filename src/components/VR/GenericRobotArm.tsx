import { Vector3, Quaternion } from "three";

interface GenericRobotArmProps {
  a: number;  // side length of square base
  b: number;  // desired block length
  r: number;  // sphere radius at joint
  l: number;  // cone length (base radius = a)
  base: [number, number, number];      // bx, by, bz
  end: [number, number, number];       // ex, ey, ez
  direction: [number, number, number]; // direction vector for cone / second block
}

const Y_AXIS = new Vector3(0, 1, 0);

function quaternionFromDirection(dir: Vector3): Quaternion {
  const n = dir.clone().normalize();
  if (n.dot(Y_AXIS) < -0.9999) {
    return new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), Math.PI);
  }
  return new Quaternion().setFromUnitVectors(Y_AXIS, n);
}

function solveIK(
  base: Vector3,
  end: Vector3,
  dir: Vector3,
  b: number
): { elbow: Vector3; length1: number; length2: number } {
  // Line: P(t) = end + t * dir
  // Sphere: |P - base|² = b²
  // => t² + 2t(V·D) + |V|² - b² = 0  where V = end - base, D = dir (unit)
  const V = end.clone().sub(base);
  const vDotD = V.dot(dir);
  const vLenSq = V.lengthSq();
  const disc = vDotD * vDotD - vLenSq + b * b;

  if (disc <= 0) {
    // Option A: no real intersection (or tangent)
    // Closest point on line to base
    const tClosest = -vDotD;
    const elbow = end.clone().add(dir.clone().multiplyScalar(tClosest));
    return {
      elbow,
      length1: elbow.clone().sub(base).length(),
      length2: Math.abs(tClosest),
    };
  }

  // Option B: two intersections
  const sqrtDisc = Math.sqrt(disc);
  const t1 = -vDotD + sqrtDisc;
  const t2 = -vDotD - sqrtDisc;

  // Choose the elbow whose distance to end is closest to b
  const pick =
    Math.abs(Math.abs(t1) - b) <= Math.abs(Math.abs(t2) - b) ? t1 : t2;
  const elbow = end.clone().add(dir.clone().multiplyScalar(pick));

  return {
    elbow,
    length1: b,
    length2: Math.abs(pick),
  };
}

export default function GenericRobotArm({
  a,
  b,
  r,
  l,
  base,
  end,
  direction,
}: GenericRobotArmProps) {
  const baseVec = new Vector3(...base);
  const endVec = new Vector3(...end);
  const dirVec = new Vector3(...direction).normalize();

  if (dirVec.lengthSq() < 0.0001) return null;

  const { elbow, length1, length2 } = solveIK(baseVec, endVec, dirVec, b);

  // First block: base → elbow
  const dir1 = elbow.clone().sub(baseVec);
  const dir1Norm =
    dir1.length() > 0.0001 ? dir1.clone().normalize() : Y_AXIS.clone();
  const mid1 = baseVec.clone().add(elbow).multiplyScalar(0.5);
  const quat1 = quaternionFromDirection(dir1Norm);

  // Second block: elbow → end (direction aligned with cone)
  const dir2 = endVec.clone().sub(elbow);
  const dir2Norm =
    dir2.length() > 0.0001 ? dir2.clone().normalize() : dirVec.clone();
  const mid2 = elbow.clone().add(endVec).multiplyScalar(0.5);
  const quat2 = quaternionFromDirection(dir2Norm);

  // Cone: base at end, tip at end + dir * l
  const coneMid = endVec.clone().add(dirVec.clone().multiplyScalar(l / 2));
  const quatCone = quaternionFromDirection(dirVec);

  return (
    <group>
      {/* First block (scaled from 1 unit) */}
      <mesh
        position={mid1.toArray()}
        quaternion={quat1}
        scale={[1, length1, 1]}
      >
        <boxGeometry args={[a, 1, a]} />
        <meshStandardMaterial color="#888888" />
      </mesh>

      {/* Joint sphere */}
      <mesh position={elbow.toArray()}>
        <sphereGeometry args={[r, 16, 16]} />
        <meshStandardMaterial color="#aaaaaa" />
      </mesh>

      {/* Second block (scaled from 1 unit) */}
      <mesh
        position={mid2.toArray()}
        quaternion={quat2}
        scale={[1, length2, 1]}
      >
        <boxGeometry args={[a, 1, a]} />
        <meshStandardMaterial color="#888888" />
      </mesh>

      {/* Cone tool */}
      <mesh position={coneMid.toArray()} quaternion={quatCone}>
        <coneGeometry args={[a, l, 32]} />
        <meshStandardMaterial color="#666666" />
      </mesh>
    </group>
  );
}
