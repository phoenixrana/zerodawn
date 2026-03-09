/// <reference lib="webworker" />

self.onmessage = (event: MessageEvent<{ fen: string }>) => {
  const { fen } = event.data;
  // Placeholder worker channel for future Stockfish UCI wiring.
  // Keeping this worker lightweight avoids UI thread blocking when upgraded.
  self.postMessage({
    fen,
    bestMove: null,
    evaluation: 0,
    source: "worker-placeholder"
  });
};

export {};