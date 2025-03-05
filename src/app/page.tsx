"use client";

import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { CONTRACT_ADDRESS, CONTRACT_ABI } from "./constants/abi";
import Image from "next/image";
import BackgroundSlideshow from "@/components/BackgroundSlideshow";
import ProgressLoader from "@/components/ProgressLoader";
// import ConnectWallet from "@/components/ConnectWallet";
import { createClient } from '@supabase/supabase-js'
import EthereumProvider from '@/app/types/global';

interface NFTImage {
  id: string;
  src: string;
  ipfsHash: string;
  isMinted: boolean;
}

interface MintedNFTRecord {
  image_id: string;
}

const PREDEFINED_IMAGES: NFTImage[] = [
  {
    id: '1',
    src: '/nftImages/1.jpg',
    ipfsHash: 'ipfs://bafkreicmjuaafim57ioyl6ewifo5bsimwyukk3uj6cdxd7h3kv2p7qyoza',
    isMinted: false
  },
  {
    id: '2',
    src: '/nftImages/2.jpg',
    ipfsHash: 'ipfs://bafkreidu6bqmutzegy5f6xuab5mvnsbv3lhl4ro5mbqkrbp3hrd737cm5e',
    isMinted: false
  },
  {
    id: '3',
    src: '/nftImages/3.jpg',
    ipfsHash: 'ipfs://bafkreicsha3adgjrldgqm3b7rzawtd7z5gxo6nwxauzicv43vkw7w5jcla',
    isMinted: false
  },
  {
    id: '4',
    src: '/nftImages/4.jpg',
    ipfsHash: 'ipfs://bafkreiannmu23pgxtfw25tdl2xl5etknqoqtojh4ftbisjfmcoc3x6fuqe',
    isMinted: false
  },
  {
    id: '5',
    src: '/nftImages/5.jpg',
    ipfsHash: 'ipfs://bafkreidtwvyoq3ygq7gn4tij4pr6hqh7xo36to3u4kmtnqk6gr2cjnp7ta',
    isMinted: false
  },
  {
    id: '6',
    src: '/nftImages/6.jpg',
    ipfsHash: 'ipfs://bafkreieutd7xmi4is5bluxy55ep6tmq7ehi3h4j7tioavxtzep3hrzdloi',
    isMinted: false
  }
];

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<NFTImage[]>(PREDEFINED_IMAGES);
  const [currentMintingId, setCurrentMintingId] = useState<string | null>(null);
  const [miningStatus, setMiningStatus] = useState<{
    steps: Array<{
      label: string;
      status: 'pending' | 'current' | 'completed';
    }>;
    txHash?: string;
  }>({
    steps: [
      { label: 'Approve Transaction', status: 'pending' },
      { label: 'Minting NFT', status: 'pending' },
      { label: 'Confirming Transaction', status: 'pending' }
    ]
  });
  const [walletAddress, setWalletAddress] = useState<string>("");
  const [isWalletConnected, setIsWalletConnected] = useState(false);

  const checkWalletConnection = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' }) as string[];
        if (accounts.length > 0) {
          setWalletAddress(accounts[0]);
          setIsWalletConnected(true);
        } else {
          disconnectWallet();
        }
      } catch (error) {
        console.error("Error checking wallet connection:", error);
        disconnectWallet();
      }
    }
  };

  // Initial check on load
  useEffect(() => {
    const isConnected = localStorage.getItem('isWalletConnected') === 'true';
    if (isConnected) {
      checkWalletConnection();
    }
  }, []);  // eslint-disable-line react-hooks/exhaustive-deps

  const connectWallet = async () => {
    if (!window.ethereum) {
      alert("Please install MetaMask!");
      return;
    }

    try {
      // Always request accounts to force MetaMask popup
      await window.ethereum.request({
        method: 'wallet_requestPermissions',
        params: [{ eth_accounts: {} }]
      });
      
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      }) as string[];

      if (accounts.length > 0) {
        setWalletAddress(accounts[0]);
        setIsWalletConnected(true);
        localStorage.setItem('isWalletConnected', 'true');
        await switchToBaseSepolia();
      } else {
        throw new Error('No accounts found');
      }
    } catch (error) {
      console.error("Error connecting wallet:", error);
      alert("Error connecting wallet. Please try again.");
      disconnectWallet();
    }
  };

  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts: unknown) => {
        const typedAccounts = accounts as string[];
        if (typedAccounts.length > 0) {
          setWalletAddress(typedAccounts[0]);
          setIsWalletConnected(true);
          localStorage.setItem('isWalletConnected', 'true');
        } else {
          disconnectWallet();
        }
      });

      window.ethereum.on('chainChanged', () => {
        window.location.reload();
      });

      window.ethereum.on('disconnect', () => {
        disconnectWallet();
      });
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeAllListeners();
      }
    };
  }, []);

  const addBaseSepolia = async () => {
    try {
      if (!window.ethereum) {
        throw new Error("MetaMask is not installed");
      }
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: '0x14A34',
          chainName: 'Base Sepolia',
          nativeCurrency: {
            name: 'ETH',
            symbol: 'ETH',
            decimals: 18
          },
          rpcUrls: ['https://sepolia.base.org'],
          blockExplorerUrls: ['https://sepolia.basescan.org']
        }]
      });
    } catch (error) {
      console.error('Error adding Base Sepolia:', error);
      throw error;
    }
  };

  const switchToBaseSepolia = async () => {
    try {
      if (!window.ethereum) {
        throw new Error("MetaMask is not installed");
      }
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x14A34' }],
      });
    } catch (error: unknown) {
      if (typeof error === 'object' && error && 'code' in error && error.code === 4902) {
        await addBaseSepolia();
      } else {
        throw error;
      }
    }
  };

  const mintNFT = async (imageId: string) => {
    if (!isWalletConnected) {
      alert("Please connect your wallet first!");
      return;
    }

    try {
      setLoading(true);
      setCurrentMintingId(imageId);
      
      const image = images.find(img => img.id === imageId);
      if (!image) return;

      const { data: mintedData } = await supabase
        .from('minted_nfts')
        .select('*')
        .eq('image_id', imageId)
        .single();

      if (mintedData) {
        alert("This NFT has already been minted!");
        return;
      }
      await switchToBaseSepolia();
      const provider = new ethers.providers.Web3Provider(window.ethereum as EthereumProvider);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      const mintPrice = ethers.utils.parseEther("0.02");
      setMiningStatus(prev => ({
        ...prev,
        steps: prev.steps.map((step, i) => 
          i === 0 ? { ...step, status: 'current' } : step
        )
      }));
      
      const tx = await contract.safeMint(image.ipfsHash, { value: mintPrice });

      setMiningStatus(prev => ({
        ...prev,
        txHash: tx.hash,
        steps: prev.steps.map((step, i) => 
          i === 0 ? { ...step, status: 'completed' } :
          i === 1 ? { ...step, status: 'current' } :
          step
        )
      }));

      await tx.wait();

      const { error } = await supabase
        .from('minted_nfts')
        .insert([{ 
          image_id: imageId,
          wallet_address: walletAddress,
          transaction_hash: tx.hash,
          minted_at: new Date().toISOString()
        }]);

      if (error) throw error;

      setImages(prev => prev.map(img => 
        img.id === imageId ? { ...img, isMinted: true } : img
      ));

      setMiningStatus(prev => ({
        ...prev,
        steps: prev.steps.map(step => ({ ...step, status: 'completed' }))
      }));

      alert("NFT minted successfully!");
      
    } catch (error) {
      console.error("Error minting NFT:", error);
      alert("Error minting NFT. Check console for details.");
    } finally {
      setLoading(false);
      setCurrentMintingId(null);
      setMiningStatus({
        steps: [
          { label: 'Approve Transaction', status: 'pending' },
          { label: 'Minting NFT', status: 'pending' },
          { label: 'Confirming Transaction', status: 'pending' }
        ]
      });
    }
  };

  useEffect(() => {
    const checkMintedStatus = async () => {
      const { data: mintedNFTs, error } = await supabase
        .from('minted_nfts')
        .select('image_id');

      if (error) {
        console.error("Error fetching minted NFTs:", error);
        return;
      }

      if (mintedNFTs) {
        setImages(prev => prev.map(img => ({
          ...img,
          isMinted: mintedNFTs.some((nft: MintedNFTRecord) => nft.image_id === img.id)
        })));
      }
    };

    checkMintedStatus();
  }, []);

  const disconnectWallet = () => {
    setWalletAddress("");
    setIsWalletConnected(false);
    localStorage.removeItem('isWalletConnected');
  };

  return (
    <>
      <BackgroundSlideshow />
      <main className="min-h-screen relative">
        <div className="absolute top-4 right-4 z-10">
          {isWalletConnected ? (
            <div className="flex items-center gap-2">
              <div className="bg-white/10 backdrop-blur-lg rounded-full px-4 py-2 border border-white/20">
                <p className="text-emerald-200 text-sm">
                  {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                </p>
              </div>
              <button
                onClick={disconnectWallet}
                className="bg-red-500/50 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-full transition-colors"
              >
                Disconnect
              </button>
            </div>
          ) : (
            <button
              onClick={connectWallet}
              className="bg-emerald-500/50 hover:bg-emerald-600 text-white font-bold py-2 px-6 rounded-full transition-colors"
            >
              Connect Wallet
            </button>
          )}
        </div>
        
        <div className="max-w-6xl mx-auto px-4 py-12">
          <h1 className="text-6xl md:text-7xl font-bold text-center mb-8">
            <span className="inline-block text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-teal-200 to-emerald-300 animate-gradient-x">
              Nature NFT Collection
            </span>
          </h1>

          <div className="text-center mb-8">
            <div className="inline-block bg-white/5 backdrop-blur-lg rounded-lg p-6 border border-white/10 transform hover:scale-105 transition-all duration-300">
              <p className="text-emerald-200 mb-4 text-lg">
                Contract Address:{' '}
                <a
                  href="https://sepolia.basescan.org/address/0x7eDE2f5455Bc9498c5B79CF5F7ef16e4Cc5Df617"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300 hover:from-emerald-300 hover:to-teal-200 font-mono transition-all duration-300"
                >
                  {CONTRACT_ADDRESS}
                </a>
              </p>
              <p className="text-2xl font-bold">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">
                  Mint Price: 0.02 ETH
                </span>
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {images.map((image) => (
              <div 
                key={image.id}
                className={`bg-white/10 backdrop-blur-xl rounded-xl p-4 border border-white/20 transition-all duration-300 ${
                  image.isMinted ? 'opacity-70' : 'hover:scale-105'
                }`}
              >
                <div className="relative aspect-square mb-4 rounded-lg overflow-hidden">
                  <Image
                    src={image.src}
                    alt={`Nature NFT ${image.id}`}
                    fill
                    className="object-cover"
                  />
                  {image.isMinted && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <span className="text-white font-bold text-lg">Minted</span>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => mintNFT(image.id)}
                  disabled={Boolean(image.isMinted || loading || !isWalletConnected || (currentMintingId && currentMintingId !== image.id))}
                  className={`w-full py-2 px-4 rounded-lg font-bold transition-colors ${
                    image.isMinted
                      ? 'bg-gray-500 cursor-not-allowed'
                      : 'bg-emerald-500/50 hover:bg-emerald-600 text-white'
                  }`}
                >
                  {image.isMinted 
                    ? 'Minted'
                    : currentMintingId === image.id
                    ? 'Minting...'
                    : 'Mint (0.02 ETH)'}
                </button>
              </div>
            ))}
          </div>

          {isWalletConnected && images.some(img => img.isMinted) && (
            <div className="mt-16">
              <h2 className="text-3xl font-bold text-center mb-8">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-teal-300">
                  Your Minted NFTs
                </span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {images.filter(img => img.isMinted).map((image) => (
                  <div 
                    key={image.id}
                    className="bg-white/10 backdrop-blur-xl rounded-xl p-4 border border-white/20 transform hover:scale-105 transition-all duration-300"
                  >
                    <div className="relative aspect-square mb-4 rounded-lg overflow-hidden">
                      <Image
                        src={image.src}
                        alt={`Nature NFT ${image.id}`}
                        fill
                        className="object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end justify-center p-4">
                        <span className="text-white font-bold text-lg">NFT #{image.id}</span>
                      </div>
                    </div>
                    <a
                      href={`https://sepolia.basescan.org/token/${CONTRACT_ADDRESS}?a=${walletAddress}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full text-center py-2 px-4 rounded-lg bg-emerald-500/30 hover:bg-emerald-500/50 text-white font-bold transition-colors"
                    >
                      View on Explorer
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}

          {loading && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
              <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 max-w-md w-full mx-4">
                <ProgressLoader steps={miningStatus.steps} />
                {miningStatus.txHash && (
                  <div className="text-center mt-6">
                    <p className="text-emerald-200 mb-2">Transaction Hash:</p>
                    <a 
                      href={`https://sepolia.basescan.org/tx/${miningStatus.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-400 hover:text-emerald-300 break-all"
                    >
                      {miningStatus.txHash}
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}