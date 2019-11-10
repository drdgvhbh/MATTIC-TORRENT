import WebTorrent from "webtorrent";
import React, { useCallback, useState, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import nanoid from "nanoid";
import * as config from "./config";
import Matic from "maticjs";
import BigNumber from "bignumber.js";

const matic = new Matic({
  maticProvider: config.MATIC_PROVIDER,
  parentProvider: config.PARENT_PROVIDER,
  rootChainAddress: config.ROOTCHAIN_ADDRESS,
  syncerUrl: config.SYNCER_URL,
  watcherUrl: config.WATCHER_URL,
  maticWethAddress: config.MATICWETH_ADDRESS
});

console.log(matic)
const token = config.ROPSTEN_TEST_TOKEN;

const ONE_GWEI = new BigNumber("00000000001");
(matic.wallet as any) = "3f37a3de5db9860e600d578363534cf0f31814b5e6a2253f627e1802a2c35f9e";

const PUBLIC_KEY = "0x8331E67aBd1D5248e349bc86E032Fd7bf4C7008d";

const Leecher = () => {
  const [client, setClient] = useState(new WebTorrent());

  const [magnetURI, setMagnetURI] = useState("");
  const [seederAddr, setSeederAddr] = useState("");

  return (
    <div>
      <input
        value={magnetURI}
        onChange={value => setMagnetURI(value.target.value)}
      />
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
              matic
                .approveERC20TokensForDeposit(token, `${amount}`, {
                  from: PUBLIC_KEY,
                  onTransactionHash: hash => {
                    // action on Transaction success
                    console.log(hash); // eslint-disable-line
                  }
                })
                .then(() => {
                  matic.depositERC20Tokens(token, PUBLIC_KEY, `${amount}`, {
                    from: PUBLIC_KEY,
                    onTransactionHash: hash => {
                      // action on Transaction success
                      console.log(hash); // eslint-disable-line
                    }
                  });
                });
              console.log("just downloaded: " + bytes);
              console.log("total downloaded: " + torrent.downloaded);
              console.log("download speed: " + torrent.downloadSpeed);
              console.log("download progress: " + torrent.progress);
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
        GOGO
      </button>
    </div>
  );
};

export default Leecher;
