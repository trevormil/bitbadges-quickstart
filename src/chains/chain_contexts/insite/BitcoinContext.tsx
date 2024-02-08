import { checkSignIn } from '@/chains/backend_connectors';
import { BaseDefaultChainContext } from '@/chains/utils';
import { useAccount } from '@/redux/accounts/AccountsContext';
import { notification } from 'antd';
import { TransactionPayload, TxContext, convertToCosmosAddress, createTxBroadcastBodyBitcoin } from 'bitbadgesjs-sdk';
import { createContext, useContext, useState } from 'react';
import { ChainSpecificContextType } from '../ChainContext';

export type BitcoinContextType = ChainSpecificContextType & {};
export const BitcoinContext = createContext<BitcoinContextType>({
  ...BaseDefaultChainContext,
});

type Props = {
  children?: React.ReactNode;
};

export const BitcoinContextProvider: React.FC<Props> = ({ children }) => {
  const [loggedIn, setLoggedIn] = useState<boolean>(false);
  const [pubKey, setPubKey] = useState<string>('');
  const [address, setAddress] = useState<string>('');

  const cosmosAddress = convertToCosmosAddress(address);
  const connected = address ? true : false;
  const setConnected = () => { };
  const account = useAccount(cosmosAddress);

  //See Phantom docs for more info
  const getProvider = () => {
    if ('phantom' in window) {
      const phantomWindow = window as any;
      const provider = phantomWindow.phantom?.bitcoin;
      if (provider?.isPhantom) {
        return provider;
      }

      window.open('https://phantom.app/', '_blank');
    }
  };

  const connect = async () => {
    if (!address) {
      try {
        const provider = getProvider(); // see "Detecting the Provider"

        const accounts = await provider.requestAccounts();
        if (accounts.length === 0) {
          throw new Error('No account found');
        }

        const address = accounts[0].address;
        if (accounts[0].addressType !== 'p2wpkh') {
          throw new Error('Invalid account type');
        }

        const publicKey = accounts[0].publicKey; //Hex public key
        const base64PublicKey = Buffer.from(publicKey, 'hex').toString('base64');

        setAddress(address);
        setPubKey(base64PublicKey);

        const signedInRes = await checkSignIn();
        setLoggedIn(signedInRes.signedIn && signedInRes.address === address);
      } catch (e) {
        console.log(e);
        notification.error({
          message: 'Error connecting to wallet',
          description:
            'Make sure you have Phantom installed and are logged in.',
        });
      }
    }
  };

  const disconnect = async () => {
    setLoggedIn(false);
    setAddress('');
  };

  function bytesToBase64(bytes: Uint8Array) {
    const binString = String.fromCodePoint(...bytes);
    return btoa(binString);
  }

  const signChallenge = async (message: string) => {
    const encodedMessage = new TextEncoder().encode(message);
    const provider = getProvider();
    const { signature } = await provider.signMessage(address, encodedMessage);

    return { message: message, signature: bytesToBase64(signature) };
  };

  const signTxn = async (context: TxContext, payload: TransactionPayload, simulate: boolean) => {
    if (!account) throw new Error('Account not found.');
    const bitcoinProvider = getProvider();

    let sig = '';
    if (!simulate) {
      const message = payload.jsonToSign;
      const encodedMessage = new TextEncoder().encode(message);
      const signedMessage = await bitcoinProvider.signMessage(
        address,
        encodedMessage
      );

      const base64Sig = bytesToBase64(signedMessage.signature);
      sig = Buffer.from(base64Sig, 'base64').toString('hex');
    }

    const txBody = createTxBroadcastBodyBitcoin(context, payload, sig);
    return txBody;
  };

  const getPublicKey = async (_cosmosAddress: string) => {
    return pubKey;
  };

  const bitcoinContext: BitcoinContextType = {
    connected,
    setConnected,
    connect,
    disconnect,
    signChallenge,
    signTxn,
    address,
    getPublicKey,
    loggedIn,
    setLoggedIn,
  };

  return (
    <BitcoinContext.Provider value={bitcoinContext}>
      {children}
    </BitcoinContext.Provider>
  );
};

export const useBitcoinContext = () => useContext(BitcoinContext);
