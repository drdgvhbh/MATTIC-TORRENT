import WebTorrent from "webtorrent";
import React, { useCallback, useState, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import nanoid from "nanoid";
import * as config from "./config";
import Matic from "maticjs";
import BigNumber from "bignumber.js";
import Web3 from "web3";

const web3 = new Web3();

// (window as any).web3.currentProvider

const matic = new Matic({
  maticProvider: config.MATIC_PROVIDER,
  parentProvider: config.PARENT_PROVIDER,
  rootChainAddress: config.ROOTCHAIN_ADDRESS,
  syncerUrl: config.SYNCER_URL,
  watcherUrl: config.WATCHER_URL,
  maticWethAddress: config.MATICWETH_ADDRESS
});

console.log(matic);
const token = config.ROPSTEN_TEST_TOKEN;

const ONE_GWEI = new BigNumber("00000000001");
(matic.wallet as any) = "0x3f37a3de5db9860e600d578363534cf0f31814b5e6a2253f627e1802a2c35f9e";

const PUBLIC_KEY = "0x8331e67abd1d5248e349bc86e032fd7bf4c7008d";
// 0x8331E67aBd1D5248e349bc86E032Fd7bf4C7008d

// 3F37A3DE5DB9860E600D578363534CF0F31814B5E6A2253F627E1802A2C35F9E

interface DownloadState {
  lastDownloaded: number;
  totalDownloaded: number;
  downloadSpeed: number;
  progress: number;
}

const Leecher = () => {
  const [client, setClient] = useState(new WebTorrent());

  const [magnetURI, setMagnetURI] = useState("");
  const [seederAddr, setSeederAddr] = useState("");

  const [initialDeposit, setInitialDeposit] = useState("0");
  const [downloadState, setDownloadState] = useState<DownloadState>({
    lastDownloaded: 0,
    totalDownloaded: 0,
    downloadSpeed: 0,
    progress: 0
  });
  const [tokensInMatic, setTokensInMatic] = useState("");

  setTimeout(async () => {
    const balance = await matic.balanceOfERC20(
      PUBLIC_KEY,
      "0xc82c13004c06E4c627cF2518612A55CE7a3Db699",
      {}
    );

    console.log(balance);
    setTokensInMatic(balance);
  }, 1000);

  return (
    <div>
      <div>
        <div>1000000000000000000</div>
        <h2>Initial Deposit</h2>
        <input
          value={initialDeposit}
          onChange={value => setInitialDeposit(value.target.value)}
        />
        <button
          onClick={() => {
            matic
              .approveERC20TokensForDeposit(token, `${initialDeposit}`, {
                from: PUBLIC_KEY,
                onTransactionHash: hash => {
                  // action on Transaction success
                  console.log(hash); // eslint-disable-line
                }
              })
              .then(() => {
                matic.depositERC20Tokens(
                  token,
                  PUBLIC_KEY,
                  `${initialDeposit}`,
                  {
                    from: PUBLIC_KEY,
                    onTransactionHash: hash => {
                      // action on Transaction success
                      console.log(hash); // eslint-disable-line
                    }
                  }
                );
              });
          }}
        >
          Submit Initial Deposit
        </button>
      </div>
      <div></div>

      <h2>Magnet URI</h2>
      <input
        value={magnetURI}
        onChange={value => setMagnetURI(value.target.value)}
      />

      <h2>Seeder Public Key</h2>
      <input
        value={seederAddr}
        onChange={value => setSeederAddr(value.target.value)}
      />
      <button
        onClick={() => {
          console.log(magnetURI);
          client.on("torrent", torrent => {
            torrent.on("download", async bytes => {
              const amount = `${new BigNumber(torrent.downloaded).multipliedBy(
                ONE_GWEI
              )}`;

              setDownloadState({
                lastDownloaded: bytes,
                totalDownloaded: torrent.downloaded,
                downloadSpeed: torrent.downloadSpeed,
                progress: torrent.progress
              });

              await matic.transferTokens(
                "0xc82c13004c06E4c627cF2518612A55CE7a3Db699",
                seederAddr,
                amount,
                {
                  from: PUBLIC_KEY
                }
              );

              /*            console.log("just downloaded: " + bytes);
              console.log("total downloaded: " + torrent.downloaded);
              console.log("download speed: " + torrent.downloadSpeed);
              console.log("download progress: " + torrent.progress); */
            });
          });
          client.add(magnetURI, function(torrent) {
            // Torrents can contain many files. Let's use the .mp4 file
            var file = torrent.files.find(function(file) {
              return true;
            });
            console.log(file);

            // Display the file by adding it to the DOM.
            // Supports video, audio, image files, and more!
            file!.appendTo("body");
          });
        }}
      >
        Start Downloading
      </button>
      <div></div>
      <div>
        <span>Tokens in Channel: </span>
        {tokensInMatic || "0"}
        {" TEST"}
      </div>
      <div>
        <span>Last Download: </span>
        {downloadState.lastDownloaded}
        {`bytes`}
      </div>
      <div>
        <span>Total Download: </span>
        {downloadState.totalDownloaded}
        {`bytes`}
      </div>
      <div>
        <span>Download Speed: </span>
        {downloadState.downloadSpeed}
        {`bytes`}
      </div>
      <div>
        <span>Progress: </span>
        {downloadState.progress}
        {`bytes`}
      </div>
    </div>
  );
};

export default Leecher;
