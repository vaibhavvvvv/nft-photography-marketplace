"use client";

import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { CONTRACT_ABI } from "./constants/abi";
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
  wallet_address: string;
}

interface MintError {
  data?: {
    message: string;
  };
  message?: string;
}

const PREDEFINED_IMAGES: NFTImage[] = [
  {
    id: '1',
    src: '/nftImages/House Sparrow in a clump.JPG',
    ipfsHash: 'ipfs://bafkreihazhbg47oqxbvnjpqqfvfgvgjm3w6n7wkqvuo4oxfoiza23scevq',
    isMinted: false
  },
  {
    id: '2',
    src: '/nftImages/House sparrow on an artificial nest.JPG',
    ipfsHash: 'ipfs://bafkreidibqqthkdx5zbugbh3byzbdrzfkuhqkbuuyor3chky5rml3weajy',
    isMinted: false
  },
  {
    id: '3',
    src: '/nftImages/House Sparrow with beak open.JPG',
    ipfsHash: 'ipfs://bafkreihp2u7u6giwqnxcmajooouba6cydiqp3ivcsytrqjjiwrbvhce77u',
    isMinted: false
  }
];

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const NETWORK_CONFIG = {
  chainId: process.env.NEXT_PUBLIC_CHAIN_ID!,
  chainName: process.env.NEXT_PUBLIC_NETWORK_NAME!,
  rpcUrls: [process.env.NEXT_PUBLIC_RPC_URL!],
  blockExplorerUrls: [process.env.NEXT_PUBLIC_EXPLORER_URL!],
  nativeCurrency: {
    name: process.env.NEXT_PUBLIC_NATIVE_CURRENCY_NAME!,
    symbol: process.env.NEXT_PUBLIC_NATIVE_CURRENCY_SYMBOL!,
    decimals: parseInt(process.env.NEXT_PUBLIC_NATIVE_CURRENCY_DECIMALS!)
  }
};

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS!;

// Add type for error
interface SwitchNetworkError {
  code: number;
  message: string;
}

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
  const [mintedNFTs, setMintedNFTs] = useState<MintedNFTRecord[]>([]);

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

  const addNetwork = async () => {
    if (!window.ethereum) return;
    
    try {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: NETWORK_CONFIG.chainId,
          chainName: NETWORK_CONFIG.chainName,
          nativeCurrency: NETWORK_CONFIG.nativeCurrency,
          rpcUrls: NETWORK_CONFIG.rpcUrls,
          blockExplorerUrls: NETWORK_CONFIG.blockExplorerUrls
        }]
      });
    } catch (error) {
      console.error('Error adding network:', error);
      throw error;
    }
  };

  const switchNetwork = async () => {
    if (!window.ethereum) return;
    
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: NETWORK_CONFIG.chainId }],
      });
    } catch (error: unknown) {
      // Type guard for the error
      if (
        typeof error === 'object' && 
        error !== null && 
        'code' in error && 
        (error as SwitchNetworkError).code === 4902
      ) {
        await addNetwork();
      } else {
        throw error;
      }
    }
  };

  const connectWallet = async () => {
    if (!window.ethereum) {
      alert("Please install MetaMask!");
      return;
    }

    try {
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
        await switchNetwork();
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
      await switchNetwork();
      const provider = new ethers.providers.Web3Provider(window.ethereum as EthereumProvider);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
      const mintPrice = ethers.utils.parseEther("2");
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
      
    } catch (error: unknown) {
      console.error("Error minting NFT:", error);
      // Type guard to check if error matches our interface
      const mintError = error as MintError;
      const errorMessage = mintError.data?.message || mintError.message || "Unknown error occurred";
      alert("Error minting NFT. Check console for details. " + errorMessage);
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
      const { data: mintedData, error } = await supabase
        .from('minted_nfts')
        .select('image_id, wallet_address');

      if (error) {
        console.error("Error fetching minted NFTs:", error);
        return;
      }

      if (mintedData) {
        setMintedNFTs(mintedData);
        setImages(prev => prev.map(img => ({
          ...img,
          isMinted: mintedData.some((nft: MintedNFTRecord) => nft.image_id === img.id)
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
          <div className="flex flex-col md:flex-row justify-center items-center gap-2 mb-8">
            <div className="relative w-[300px] mt-4 h-[100px]">
              <Image
                src="/indian-sparrow.jpg"
                alt="Indian Sparrow"
                fill
                className="object-contain"
                priority
              />
            </div>
            <div className="relative w-[300px] h-[100px]">
              <Image
                src="/nft-collection.jpg"
                alt="NFT Collection"
                fill
                className="object-contain"
                priority
              />
            </div>
          </div>

          <div className="text-center mb-8">
            <div className="inline-block bg-white/5 backdrop-blur-lg rounded-lg p-6 border border-white/10">
            <p className="text-emerald-200 mb-4 text-lg">
                Contract Address:{" "}
                <a
                  href={`${NETWORK_CONFIG.blockExplorerUrls[0]}/address/${CONTRACT_ADDRESS}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300 hover:from-emerald-300 hover:to-teal-200 font-mono transition-all duration-300"
                >
                  <span className="hidden md:inline">{CONTRACT_ADDRESS}</span>
                  <span className="inline md:hidden">
                    {CONTRACT_ADDRESS.slice(0, 6)}...{CONTRACT_ADDRESS.slice(-4)}
                  </span>
                </a>
              </p>
              <p className="text-emerald-200 mb-4 text-lg">
                Network:{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300 font-bold">
                  {NETWORK_CONFIG.chainName}
                </span>
              </p>
              <p className="text-emerald-200 mb-4 text-lg">
                Currency:{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300 font-bold">
                  {NETWORK_CONFIG.nativeCurrency.name}
                </span>
              </p>
              <p className="text-2xl font-bold">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">
                  Mint Price: 2 {NETWORK_CONFIG.nativeCurrency.symbol}
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
                    : 'Mint (2 ETH)'}
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
                {images
                  .filter(img => {
                    const mintedByCurrentWallet = mintedNFTs.some(
                      nft => nft.image_id === img.id && nft.wallet_address.toLowerCase() === walletAddress.toLowerCase()
                    );
                    return mintedByCurrentWallet;
                  })
                  .map((image) => (
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
                        href={`${NETWORK_CONFIG.blockExplorerUrls[0]}/token/${CONTRACT_ADDRESS}?a=${walletAddress}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block w-full text-center py-2 px-4 rounded-lg bg-emerald-500/30 hover:bg-emerald-500/50 text-white font-bold transition-colors"
                      >
                        View on Explorer
                      </a>
                    </div>
                  ))}
              </div>
              {images.filter(img => 
                mintedNFTs.some(
                  nft => nft.image_id === img.id && nft.wallet_address.toLowerCase() === walletAddress.toLowerCase()
                )
              ).length === 0 && (
                <p className="text-center text-emerald-200 mt-4">
                  You haven&apos;t minted any NFTs yet
                </p>
              )}
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
                      href={`${NETWORK_CONFIG.blockExplorerUrls[0]}/tx/${miningStatus.txHash}`}
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