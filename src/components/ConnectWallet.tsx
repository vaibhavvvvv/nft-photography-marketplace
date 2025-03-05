interface ConnectWalletProps {
  isConnected: boolean;
  address: string;
  onConnect: () => Promise<void>;
}

export default function ConnectWallet({ isConnected, address, onConnect }: ConnectWalletProps) {
  return (
    <div className="absolute top-4 right-4">
      {isConnected ? (
        <div className="bg-white/10 backdrop-blur-lg rounded-full px-4 py-2 border border-white/20">
          <p className="text-emerald-200 text-sm">
            {address.slice(0, 6)}...{address.slice(-4)}
          </p>
        </div>
      ) : (
        <button
          onClick={onConnect}
          className="bg-emerald-500/50 hover:bg-emerald-600 text-white font-bold py-2 px-6 rounded-full transition-colors"
        >
          Connect Wallet
        </button>
      )}
    </div>
  );
} 