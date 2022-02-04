import React from 'react';
import './Video.css';

export default function VideoConnect() {
  const localVideoRef = React.useRef(null);
  const remoteVideoRef = React.useRef(null);
  const constraints = {
    video: true,
    audio: false,
  }
  const offerOptions = {
    offerToReceiveVideo: 1,
  }
  var localPeerConnection = null;
  var remotePeerConnection = null;
  var localStream = null;

  function getRemoteStream(event) {
    console.log(event.stream);
    remoteVideoRef.current.srcObject = event.stream;
  }
  function handleConnection(event) {
    const peerConnection = event.target;
    const iceCandidate = event.candidate;

    if (iceCandidate) {
      const newIceCandidate = new RTCIceCandidate(iceCandidate);
      const otherPeer = (peerConnection === localPeerConnection) ? remotePeerConnection : localPeerConnection;
      otherPeer.addIceCandidate(newIceCandidate)
        .then(() => {
          console.log("connection success");
        })
        .catch(() => {
          console.log("connection failure");
        });
    }
  }
  function handleConnectionChange(event) {
    console.log('connection change success');
  }
  function createdOffer(description) {
    localPeerConnection.setLocalDescription(description)
      .then(() => {
        console.log("LocalPeerConnection success");
      })
      .catch(() => {
        console.log("LocalPeerConnection Failure");
      })
    remotePeerConnection.setRemoteDescription(description)
      .then(() => {
        console.log("RemotePeerConnection Success");
      })
      .catch(() => {
        console.log("RemotePeerConnection Failure");
      })
    remotePeerConnection.createAnswer()
      .then(createdAnswer)
      .catch(() => {
        console.log("RemoteCreateAnswer Failure");
      })
  }
  function createdAnswer(description) {
    remotePeerConnection.setLocalDescription(description)
      .then(() => {
        console.log("RemotePeer set LocalDescription Success");
      })
      .catch(() => {
        console.log("RemotePeer set LocalDescription Success");
      });

    localPeerConnection.setRemoteDescription(description)
    .then(() => {
      console.log("LocalPeer set RemoteDescription Success");
    })
    .catch(() => {
      console.log("LocalPeer set RemoteDescription Success");
    });
  }
  function calling() {
    localPeerConnection = new RTCPeerConnection(null);
    localPeerConnection.addEventListener('icecandidate', handleConnection);
    localPeerConnection.addEventListener('iceconnectionstatechange', handleConnectionChange)

    remotePeerConnection = new RTCPeerConnection(null);
    remotePeerConnection.addEventListener('icecandidate', handleConnection);
    remotePeerConnection.addEventListener('iceconnectionstatechange', handleConnectionChange);
    remotePeerConnection.addEventListener('addstream', getRemoteStream);

    localPeerConnection.addStream(localStream);

    localPeerConnection.createOffer(offerOptions)
      .then(createdOffer)
      .catch((error) => {
        console.log('createOffer Error', error);
      })
  }


  React.useEffect(() => {
    navigator.mediaDevices.getUserMedia(constraints)
      .then((stream) => {
        localStream = stream;
        localVideoRef.current.srcObject = stream;
      })
      .catch((error) => {
        console.log("ERROR", error);
      });
  }, []);

  return (
    <div className="VideoView">
      <video playsInline autoPlay ref={localVideoRef} />
      <video playsInline autoPlay ref={remoteVideoRef} />
      <br />
      <button onClick={calling}>CALL</button>
    </div>
  )
}
