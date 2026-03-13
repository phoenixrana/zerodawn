import { Canvas } from "@react-three/fiber";
import { OrbitControls, Text } from "@react-three/drei";
import type { BoardPiece } from "../types";

interface ChessBoard3DProps {
  pieces: BoardPiece[];
  legalTargets: string[];
  selectedSquare?: string;
  onSquareClick: (square: string) => void;
}

const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"];
const RANKS = ["1", "2", "3", "4", "5", "6", "7", "8"];

const PIECE_LABEL: Record<string, string> = {
  wp: "P",
  wn: "N",
  wb: "B",
  wr: "R",
  wq: "Q",
  wk: "K",
  bp: "P",
  bn: "N",
  bb: "B",
  br: "R",
  bq: "Q",
  bk: "K"
};

function squareToPosition(square: string): [number, number, number] {
  const file = FILES.indexOf(square[0]);
  const rank = RANKS.indexOf(square[1]);
  return [file - 3.5, 0, 3.5 - rank];
}

function SquareTile({
  square,
  dark,
  selected,
  target,
  onClick
}: {
  square: string;
  dark: boolean;
  selected: boolean;
  target: boolean;
  onClick: (square: string) => void;
}) {
  const [x, , z] = squareToPosition(square);
  const color = selected ? "#f7b944" : target ? "#8cd6a6" : dark ? "#876041" : "#f1e0c8";

  return (
    <mesh position={[x, -0.08, z]} onClick={() => onClick(square)} receiveShadow>
      <boxGeometry args={[1, 0.16, 1]} />
      <meshStandardMaterial color={color} />
    </mesh>
  );
}

function PieceMesh({
  piece,
  onClick
}: {
  piece: BoardPiece;
  onClick: (square: string) => void;
}) {
  const [x, , z] = squareToPosition(piece.square);
  const fill = piece.color === "w" ? "#fbfaf7" : "#16202f";
  const text = piece.color === "w" ? "#16202f" : "#fbfaf7";

  return (
    <group position={[x, 0.35, z]} onClick={() => onClick(piece.square)}>
      <mesh castShadow>
        <cylinderGeometry args={[0.24, 0.38, 0.7, 28]} />
        <meshStandardMaterial color={fill} metalness={0.15} roughness={0.4} />
      </mesh>
      <Text position={[0, 0.1, 0]} fontSize={0.22} color={text} anchorX="center" anchorY="middle">
        {PIECE_LABEL[`${piece.color}${piece.type}`]}
      </Text>
    </group>
  );
}

export function ChessBoard3D({
  pieces,
  legalTargets,
  selectedSquare,
  onSquareClick
}: ChessBoard3DProps) {
  const tiles = [];

  for (let rank = 8; rank >= 1; rank -= 1) {
    for (let file = 0; file < 8; file += 1) {
      const square = `${FILES[file]}${rank}`;
      tiles.push({ square, dark: (file + rank) % 2 === 0 });
    }
  }

  return (
    <Canvas camera={{ position: [0, 8.5, 8.5], fov: 44 }} shadows>
      <color attach="background" args={["#efe6d7"]} />
      <ambientLight intensity={0.7} />
      <directionalLight castShadow intensity={1.15} position={[8, 12, 6]} />
      <mesh position={[0, -0.34, 0]} receiveShadow>
        <boxGeometry args={[9.4, 0.5, 9.4]} />
        <meshStandardMaterial color="#5b4635" />
      </mesh>

      {tiles.map((tile) => (
        <SquareTile
          key={tile.square}
          square={tile.square}
          dark={tile.dark}
          selected={selectedSquare === tile.square}
          target={legalTargets.includes(tile.square)}
          onClick={onSquareClick}
        />
      ))}

      {pieces.map((piece) => (
        <PieceMesh
          key={`${piece.square}-${piece.type}-${piece.color}`}
          piece={piece}
          onClick={onSquareClick}
        />
      ))}

      <OrbitControls enablePan={false} minDistance={7} maxDistance={14} maxPolarAngle={Math.PI / 2.15} />
    </Canvas>
  );
}
