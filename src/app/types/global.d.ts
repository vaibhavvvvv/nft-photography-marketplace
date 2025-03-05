interface EthereumProvider {
  isMetaMask?: boolean;
  request: (args: {
    method: string;
    params?: unknown[] | object;
  }) => Promise<unknown>;
  on: (event: string, callback: (params: unknown) => void) => void;
  removeAllListeners: () => void;
}

declare global {
  interface Window {
    ethereum?: EthereumProvider;
  }
}

export default EthereumProvider;