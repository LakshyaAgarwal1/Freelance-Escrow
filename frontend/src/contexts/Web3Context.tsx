import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { ethers, BrowserProvider, Contract, JsonRpcSigner } from "ethers";
import { DEFAULT_CONTRACT_ADDRESS, FREELANCE_ESCROW_ABI } from "../contracts/escrowContract";

interface Web3ContextType {
  account: string | null;
  chainId: number | null;
  networkName: string;
  provider: BrowserProvider | null;
  signer: JsonRpcSigner | null;
  contract: Contract | null;
  contractAddress: string;
  isConnecting: boolean;
  error: string | null;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  switchNetwork: (targetChainId: number) => Promise<void>;
  setContractAddress: (addr: string) => void;
}

const Web3Context = createContext<Web3ContextType>({} as Web3ContextType);

const HARDHAT_CHAIN_ID = 31337;

export const Web3Provider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [account, setAccount] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [networkName, setNetworkName] = useState<string>("Disconnected");
  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [signer, setSigner] = useState<JsonRpcSigner | null>(null);
  const [contract, setContract] = useState<Contract | null>(null);
  const [contractAddress, setContractAddress] = useState<string>(DEFAULT_CONTRACT_ADDRESS);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const getNetworkLabel = (id: number | null): string => {
    switch (id) {
      case 31337:
      case 1337:
        return "Hardhat Local (31337)";
      case 11155111:
        return "Sepolia Testnet";
      case 1:
        return "Ethereum Mainnet";
      default:
        return id ? `Network (${id})` : "Disconnected";
    }
  };

  const updateWeb3State = useCallback(async (browserProvider: BrowserProvider) => {
    try {
      const network = await browserProvider.getNetwork();
      const currentChainId = Number(network.chainId);
      setChainId(currentChainId);
      setNetworkName(getNetworkLabel(currentChainId));

      const accounts = await browserProvider.listAccounts();
      if (accounts.length > 0) {
        const currentSigner = await browserProvider.getSigner();
        const address = await currentSigner.getAddress();
        setAccount(address);
        setSigner(currentSigner);

        const escrowContract = new Contract(contractAddress, FREELANCE_ESCROW_ABI, currentSigner);
        setContract(escrowContract);
      } else {
        setAccount(null);
        setSigner(null);
        setContract(null);
      }
    } catch (err: any) {
      console.error("Error updating Web3 state:", err);
      setError(err?.message || "Failed to sync Web3 state");
    }
  }, [contractAddress]);

  const connectWallet = async () => {
    if (typeof window === "undefined" || !(window as any).ethereum) {
      setError("MetaMask or compatible Web3 wallet not detected. Please install MetaMask.");
      return;
    }

    try {
      setIsConnecting(true);
      setError(null);
      const browserProvider = new BrowserProvider((window as any).ethereum);
      setProvider(browserProvider);

      await (window as any).ethereum.request({ method: "eth_requestAccounts" });
      await updateWeb3State(browserProvider);
    } catch (err: any) {
      console.error("Error connecting wallet:", err);
      setError(err?.message || "Failed to connect wallet.");
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = () => {
    setAccount(null);
    setSigner(null);
    setContract(null);
    setNetworkName("Disconnected");
    setChainId(null);
  };

  const switchNetwork = async (targetChainId: number) => {
    if (!(window as any).ethereum) return;
    const hexChainId = "0x" + targetChainId.toString(16);

    try {
      await (window as any).ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: hexChainId }],
      });
    } catch (switchError: any) {
      if (switchError.code === 4902 && targetChainId === HARDHAT_CHAIN_ID) {
        // Add hardhat network to MetaMask
        await (window as any).ethereum.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: hexChainId,
              chainName: "Hardhat Localhost",
              nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
              rpcUrls: ["http://127.0.0.1:8545"],
            },
          ],
        });
      } else {
        setError(switchError?.message || "Failed to switch network.");
      }
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined" && (window as any).ethereum) {
      const eth = (window as any).ethereum;
      const browserProvider = new BrowserProvider(eth);
      setProvider(browserProvider);

      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length === 0) {
          disconnectWallet();
        } else {
          updateWeb3State(browserProvider);
        }
      };

      const handleChainChanged = () => {
        window.location.reload();
      };

      eth.on("accountsChanged", handleAccountsChanged);
      eth.on("chainChanged", handleChainChanged);

      // Check if already authorized
      browserProvider.listAccounts().then((accounts) => {
        if (accounts.length > 0) {
          updateWeb3State(browserProvider);
        }
      });

      return () => {
        if (eth.removeListener) {
          eth.removeListener("accountsChanged", handleAccountsChanged);
          eth.removeListener("chainChanged", handleChainChanged);
        }
      };
    }
  }, [updateWeb3State]);

  return (
    <Web3Context.Provider
      value={{
        account,
        chainId,
        networkName,
        provider,
        signer,
        contract,
        contractAddress,
        isConnecting,
        error,
        connectWallet,
        disconnectWallet,
        switchNetwork,
        setContractAddress,
      }}
    >
      {children}
    </Web3Context.Provider>
  );
};

export const useWeb3 = () => useContext(Web3Context);
