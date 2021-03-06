import React from 'react';
// import './Video.css';
import socketClient from 'socket.io-client';
import { Box, Button, Grid, Card, CardMedia, CardActions, Typography, CardContent } from '@mui/material';

const SERVER = "https://webrtcreact.herokuapp.com";

const socket = socketClient(SERVER);

var isHost = false;
var room = 'hoge';

const constraints = {
  video: true,
  audio: false,
}
const offerOptions = {
  offerToReceiveVideo: 1,
}


var localStream = null;
var remoteStream = null;
var peerConnection = null;
var isStarted = false;

let config = {
  "iceServers": [
    {
      url: 'stun:global.stun.twilio.com:3478?transport=udp',
      urls: 'stun:global.stun.twilio.com:3478?transport=udp'
    }
  ]
};


export default function VideoConnect4() {
  const localVideoRef = React.useRef(null);
  const remoteVideoRef = React.useRef(null);
  const [isKnocking, setIsKnocking] = React.useState(false);
  const [canCalling, setCanCalling] = React.useState(false);
  const [isAllowed, setIsAllowed] = React.useState(false);

  socket.on('knocked response', (numClients, room) => {
    if (numClients === 0) {
      socket.emit('create', room);
    } else if (numClients === 1) {
      socket.emit('join', room);
    } else {
      console.log("room [" + room + "] is full.");
    }
  });
  socket.on('created', (room) => {
    console.log('[Server said] you created room [' + room + ']');
    isHost = true;
    if (!isStarted) {
      startConnect();
    }
  });
  socket.on('joined', (room, id) => {
    console.log('[Server said] ' + id + ' joined room [' + room + ']');
    if (isHost) {
      setIsKnocking(true);
    } else {
      if (!isStarted) {
        startConnect();
      }
    }
  });
  socket.on('allowed', () => {
    console.log('allowed!');
    setIsAllowed(true);
  });
  socket.on('offer', (description) => {
    console.log('Offer received');
    if (!isHost && !isStarted) {
      startConnect();
    }
    peerConnection.setRemoteDescription(description);
    peerConnection.createAnswer()
      .then(setLocalAndSendMessage)
      .catch(handleAnswerError);
  });
  socket.on('answer', (description) => {
    console.log('Answer received');
    if (isStarted) {
      peerConnection.setRemoteDescription(description);
    }
  });
  socket.on('candidate', (description) => {
    console.log('candidate Recieved');
    if (isStarted) {
      peerConnection.addIceCandidate(
        new RTCIceCandidate({
          sdpMLineIndex: description.label,
          candidate: description.candidate,
        })
      );
    }
  });

  function createPeerConnection() {
    try {
      peerConnection = new RTCPeerConnection( config );
      peerConnection.onicecandidate = handleConnection;
      peerConnection.onaddstream = handleAddStream;
      peerConnection.onremovestream = handleRemoveStream;
      console.log('PeerConnection is created');
    } catch (error) {
      console.log('[ERROR]', error);
      return;
    }
  }
  function handleConnection(event) {
    if (event.candidate && peerConnection.signalingState !== 'stable') {
      console.log(peerConnection.signalingState);
      socket.emit('message', {
        type: 'candidate',
        label: event.candidate.sdpMLineIndex,
        id: event.candidate.sdpMid,
        candidate: event.candidate.candidate
      });
    } else {
      console.log('End of candidates');
    }
  }
  function handleAddStream(event) {
    console.log('add stream');
    remoteStream = event.stream;
  }
  function handleRemoveStream(event) {
    console.log(event);
  }
  function startConnect() {
    createPeerConnection();
    peerConnection.addStream(localStream);
    isStarted = true;
    if (!isHost) {
      peerConnection.createOffer(offerOptions)
        .then(setLocalAndSendMessage)
        .catch(handleOfferError);
    }
  }
  function setLocalAndSendMessage(description) {
    peerConnection.setLocalDescription(description);
    socket.emit('message', description);
  }
  function handleOfferError(error) {
    console.log("[ERROR]", error);
  }
  function handleAnswerError(error) {
    console.log("[ERROR]" + error.toString());
  }
  function allowJoin() {
    console.log('allow');
    socket.emit('allow');
    setIsAllowed(true);
  }
  function calling() {
    socket.emit('knock', room);
  }

  React.useEffect(() => {
    navigator.mediaDevices.getUserMedia(constraints)
      .then((stream) => {
        localStream = stream;
        console.log(localStream);
        localVideoRef.current.srcObject = stream;
        setCanCalling(true);
      })
      .catch((error) => {
        console.log("ERROR", error);
      });
    const adapterScript = document.createElement('script');
    adapterScript.src = "https://webrtc.github.io/adapter/adapter-latest.js";
    adapterScript.async = true;
    document.body.appendChild(adapterScript);
    return () => {
      document.body.removeChild(adapterScript);
    };
  }, []);
  React.useEffect(() => {
    remoteVideoRef.current.srcObject = remoteStream;
  },[isAllowed]);

  return (
    <div className="VideoView">
      <Grid container spacing={2} alignItems="flex-start" justifyContent="center">
        <Grid item xs>
          <div>
            <Card sx={{ width: 400, height: 280 }}>
              <CardMedia sx={{ height: 225 }} component="video" playsInline autoPlay ref={localVideoRef} />
              <CardActions>
                <Button variant="contained" onClick={calling} disabled={!canCalling}>CALL</Button>
                <Button variant="contained" onClick={allowJoin} disabled={!isKnocking}>ALLOW</Button>
              </CardActions>
            </Card>
          </div>
        </Grid>
        <Grid item xs>
          <Card sx={{ width: 400, height: 225 }}>
            <CardMedia sx={{ height: 225 }} component="video" playsInline autoPlay ref={remoteVideoRef} />
          </Card>
        </Grid>
      </Grid>
    </div>
  )
}
