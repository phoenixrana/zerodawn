import { useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Text } from "@react-three/drei";
import { BoardPiece } from "../types";

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
  const x = file - 3.5;
  const z = rank - 3.5;
  return [x, 0, z];
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
  const color = selected ? "#f6c453" : target ? "#68d391" : dark ? "#9e6b47" : "#f3dfc1";
  const [x, , z] = squareToPosition(square);

  return (
    <mesh position={[x, -0.1, z]} onClick={() => onClick(square)} receiveShadow>
      <boxGeometry args={[1, 0.2, 1]} />
      <meshStandardMaterial color={color} />
    </mesh>
  );
}

function PieceMesh({ piece, onClick }: { piece: BoardPiece; onClick: (square: string) => void }) {
  const [x, , z] = squareToPosition(piece.square);
  const color = piece.color === "w" ? "#fff9f0" : "#1e293b";
  const textColor = piece.color === "w" ? "#1f2937" : "#f8fafc";

  return (
    <group position={[x, 0.32, z]} onClick={() => onClick(piece.square)}>
      <mesh castShadow>
        <cylinderGeometry args={[0.28, 0.38, 0.6, 32]} />
        <meshStandardMaterial color={color} />
      </mesh>
      <Text position={[0, 0.08, 0]} fontSize={0.22} color={textColor} anchorX="center" anchorY="middle">
        {PIECE_LABEL[`${piece.color}${piece.type}`]}
      </Text>
    </group>
  );
}

export function ChessBoard3D({ pieces, legalTargets, selectedSquare, onSquareClick }: ChessBoard3DProps) {
  const tiles = useMemo(() => {
    const list: Array<{ square: string; dark: boolean }> = [];
    for (let rank = 8; rank >= 1; rank -= 1) {
      for (let file = 0; file < 8; file += 1) {
        const square = `${FILES[file]}${rank}`;
        const dark = (file + rank) % 2 === 0;
        list.push({ square, dark });
      }
    }
    return list;
  }, []);

  return (
    <Canvas camera={{ position: [0, 8.5, 8.5], fov: 45 }} shadows>
      <color attach="background" args={["#f7f4ec"]} />
      <ambientLight intensity={0.65} />
      <directionalLight castShadow intensity={1.1} position={[8, 12, 6]} />
      <mesh position={[0, -0.4, 0]} receiveShadow>
        <boxGeometry args={[9.4, 0.5, 9.4]} />
        <meshStandardMaterial color="#8b5e3b" />
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
        <PieceMesh key={`${piece.square}-${piece.type}-${piece.color}`} piece={piece} onClick={onSquareClick} />
      ))}

      <OrbitControls enablePan={false} minDistance={7} maxDistance={14} maxPolarAngle={Math.PI / 2.1} />
    </Canvas>
  );
}