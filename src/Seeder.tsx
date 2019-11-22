import React, { useCallback, useState, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import WebTorrent, { Torrent } from "webtorrent";
import arrayBufferToBuffer from "arraybuffer-to-buffer";
import QRCode from "qrcode.react";
import * as config from "./config";
import Matic from "maticjs";
import { BigNumber } from "bignumber.js";

interface UploadState {
  lastUploaded: number;
  totalUploaded: number;
  uploadSpeed: number;
  progress: number;
}

// import Web3 from "web3";

// const web3 = new Web3(window.web3.currentProvider);
let MagnetURI = "";

// console.log(web3.currentProvider);
const matic = new Matic({
  maticProvider: config.MATIC_PROVIDER,
  parentProvider: config.PARENT_PROVIDER,
  //parentProvider: (window as any).web3.currentProvider,
  rootChainAddress: config.ROOTCHAIN_ADDRESS,
  syncerUrl: config.SYNCER_URL,
  watcherUrl: config.WATCHER_URL,
  maticWethAddress: config.MATICWETH_ADDRESS
});
(matic.wallet as any) = "0xe7f96af2a28403f3fc3c76ab3a425fdb9720e63f391e694c10bb01bd0937bfdc";
console.log(matic);

const ONE_GWEI = new BigNumber("00000000001");

const token = config.ROPSTEN_TEST_TOKEN;

const PUBLIC_KEY = "0xb41C61744490440c024989AB4F11289911A39Fcc";

const Seeder = () => {
  const [client] = useState(new WebTorrent());

  const [uploadState, setUploadState] = useState<UploadState>({
    lastUploaded: 0,
    totalUploaded: 0,
    uploadSpeed: 0,
    progress: 0
  });
  const [tokensInMatic, setTokensInMatic] = useState("");

  const [infoHash, setInfoHash] = useState("");
  const [magnetURI, setMagnetURI] = useState<string>("");

  useEffect(() => {
    const timer = setTimeout(async () => {
      const balance = await matic.balanceOfERC20(
        PUBLIC_KEY,
        "0xc82c13004c06E4c627cF2518612A55CE7a3Db699"
      );
      console.log(balance);
      setTokensInMatic(balance);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const onDrop = useCallback(
    acceptedFiles => {
      const reader = new FileReader();

      reader.onabort = () => console.log("file reading was aborted");
      reader.onerror = () => console.log("file reading has failed");
      reader.onload = () => {
        // Do whatever you want with the file contents
        const binaryStr: ArrayBuffer = reader.result as any;
        binaryStr.slice(0);
        client.seed(arrayBufferToBuffer(binaryStr), function(torrent: Torrent) {
          setInfoHash(torrent.infoHash);
          setMagnetURI(torrent.magnetURI);
          console.log(
            "Client is seeding:",
            torrent.infoHash,
            torrent.magnetURI
          );
          MagnetURI = torrent.magnetURI;

          torrent.on("upload", bytes => {
            setUploadState({
              uploadSpeed: torrent.uploadSpeed,
              totalUploaded: torrent.uploaded,
              lastUploaded: bytes,
              progress: torrent.progress
            });
          });
        });
      };
      console.log("start seeding!");

      acceptedFiles.forEach(file => reader.readAsArrayBuffer(file));
    },
    [client]
  );
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  return (
    <div>
      <div {...getRootProps()}>
        <input {...getInputProps()} />
        <p>Drag a file here to seed it</p>
      </div>
      {infoHash && (
        <div>
          <h1>Info Hash</h1>
          <div>{infoHash}</div>
        </div>
      )}
      {magnetURI && (
        <div>
          <h1>Magnet URI</h1>
          <div>{magnetURI}</div>
        </div>
      )}
      {magnetURI && <QRCode size={300} value={magnetURI} />}
      <div>
        <div></div>
        <div>
          {`Public Key: `}
          {PUBLIC_KEY}
        </div>
        <div>
          <span>Tokens in Channel: </span>
          {tokensInMatic || "0"}
          {" TEST"}
        </div>
        <div>
          <span>Last Upload: </span>
          {uploadState.lastUploaded}
          {`bytes`}
        </div>
        <div>
          <span>Total Upload: </span>
          {uploadState.totalUploaded}
          {`bytes`}
        </div>
        <div>
          <span>Upload Speed: </span>
          {uploadState.uploadSpeed}
          {`bytes`}
        </div>
        <div>
          <span>Progress: </span>
          {uploadState.progress}
          {`bytes`}
        </div>
      </div>
    </div>
  );
};

export default Seeder;
